import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { uploadToGoogleDrive } from "@/lib/google/drive-upload-client";

const MAX_DOWNLOAD_SIZE = 10 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 20_000;

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type UploadResult = {
  fileId: string;
  success: boolean;
  alreadyUploaded?: boolean;
  error?: string;
};

type SubmissionFile = {
  id: string;
  submission_id: string;
  cloudinary_url: string;
  google_drive_file_id: string | null;
  google_drive_url: string | null;
  google_drive_status: string | null;
};

function validateCloudinaryUrl(value: string): URL {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("Invalid Cloudinary URL.");
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== "res.cloudinary.com" ||
    url.username ||
    url.password
  ) {
    throw new Error("Only HTTPS Cloudinary image URLs are allowed.");
  }

  return url;
}

async function downloadImage(url: URL): Promise<{
  buffer: Buffer;
  mimeType: string;
}> {
  const response = await fetch(url, {
    method: "GET",
    redirect: "error",
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Cloudinary download failed with status ${response.status}.`,
    );
  }

  const mimeType = (response.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType || "unknown"}.`);
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);

  if (contentLength > MAX_DOWNLOAD_SIZE) {
    throw new Error("Image exceeds the 10 MB limit.");
  }

  if (!response.body) {
    throw new Error("Cloudinary returned an empty response.");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      totalSize += value.byteLength;

      if (totalSize > MAX_DOWNLOAD_SIZE) {
        await reader.cancel();
        throw new Error("Image exceeds the 10 MB limit.");
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const buffer = Buffer.concat(chunks);

  if (buffer.length === 0) {
    throw new Error("Downloaded image is empty.");
  }

  return { buffer, mimeType };
}

function getExtension(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      throw new Error("Unsupported image type.");
  }
}

/**
 * Upload one submission file to Google Drive.
 */
export async function uploadSubmissionFileToDrive(
  fileId: string,
): Promise<UploadResult> {
  const supabase = createAdminClient();

  try {
    // 1. Load the evidence file.
    const { data: file, error: fileError } = await supabase
      .from("submission_files")
      .select(
        `
        id,
        submission_id,
        cloudinary_url,
        google_drive_file_id,
        google_drive_url,
        google_drive_status
      `,
      )
      .eq("id", fileId)
      .maybeSingle();

    if (fileError) {
      throw new Error(`Could not load submission file: ${fileError.message}`);
    }

    if (!file) {
      throw new Error("Submission file not found.");
    }

    const submissionFile = file as SubmissionFile;

    // 2. Skip files already uploaded successfully.
    if (
      submissionFile.google_drive_status === "UPLOADED" &&
      submissionFile.google_drive_file_id &&
      submissionFile.google_drive_url
    ) {
      return {
        fileId,
        success: true,
        alreadyUploaded: true,
      };
    }

    // 3. Load the parent submission.
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, participant_id, submission_date")
      .eq("id", submissionFile.submission_id)
      .maybeSingle();

    if (submissionError) {
      throw new Error(`Could not load submission: ${submissionError.message}`);
    }

    if (!submission) {
      throw new Error("Parent submission not found.");
    }

    // 4. Load the participant's seat number.
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, seat_number")
      .eq("id", submission.participant_id)
      .maybeSingle();

    if (participantError) {
      throw new Error(
        `Could not load participant: ${participantError.message}`,
      );
    }

    if (!participant) {
      throw new Error("Participant not found.");
    }

    // 5. Download the image from Cloudinary.
    const safeUrl = validateCloudinaryUrl(submissionFile.cloudinary_url);

    const { buffer, mimeType } = await downloadImage(safeUrl);
    const extension = getExtension(mimeType);

    // 6. Use your existing production Google Drive uploader.
    const driveResult = await uploadToGoogleDrive({
      fileName: `submission-${submission.id}-${submissionFile.id}.${extension}`,
      mimeType,
      buffer,
      participantSeatNumber: participant.seat_number,
      evidenceDate: submission.submission_date,
    });

    // 7. Save the Google Drive metadata in Supabase.
    const { error: updateError } = await supabase
      .from("submission_files")
      .update({
        google_drive_file_id: driveResult.fileId,
        google_drive_url: driveResult.webViewLink,
        google_drive_status: "UPLOADED",
      })
      .eq("id", submissionFile.id);

    if (updateError) {
      throw new Error(
        `Drive upload succeeded, but saving its metadata failed: ${updateError.message}`,
      );
    }

    return {
      fileId,
      success: true,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown Google Drive upload error.";

    console.error(`Google Drive upload failed for ${fileId}:`, message);

    // Mark this file as failed so it can be retried later.
    const { error: statusError } = await supabase
      .from("submission_files")
      .update({
        google_drive_status: "PENDING",
      })
      .eq("id", fileId)
      .neq("google_drive_status", "UPLOADED");

    if (statusError) {
      console.error(
        `Could not update Drive status for ${fileId}:`,
        statusError.message,
      );
    }

    return {
      fileId,
      success: false,
      error: message,
    };
  }
}

/**
 * Upload several submission files sequentially.
 */
export async function uploadSubmissionFilesToDrive(
  fileIds: string[],
): Promise<UploadResult[]> {
  const uniqueFileIds = [...new Set(fileIds)];
  const results: UploadResult[] = [];

  for (const fileId of uniqueFileIds) {
    results.push(await uploadSubmissionFileToDrive(fileId));
  }

  return results;
}

/**
 * Retry pending or failed uploads.
 * This function can later be called by a scheduled worker.
 */
export async function retryPendingSubmissionFileUploads(
  limit = 25,
): Promise<UploadResult[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Limit must be between 1 and 100.");
  }

  const supabase = createAdminClient();

  const { data: pendingFiles, error } = await supabase
    .from("submission_files")
    .select("id")
    .in("google_drive_status", ["PENDING", "FAILED"])
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Could not load pending uploads: ${error.message}`);
  }

  if (!pendingFiles?.length) {
    return [];
  }

  return uploadSubmissionFilesToDrive(pendingFiles.map((file) => file.id));
}
