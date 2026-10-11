import "server-only";

import { Readable } from "node:stream";
import { getGoogleDriveClient } from "@/lib/google/client";

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

export interface GoogleDriveUploadInput {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  participantSeatNumber: number | string | null;
  evidenceDate: string;
}

export interface GoogleDriveUploadResult {
  fileId: string;
  webViewLink: string;
  storageEmail: string;
  dateFolder: string;
  participantFolder: string;
}

function escapeDriveQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function validateFolderName(value: string): string {
  const name = value.trim();

  if (!name || name.length > 150) {
    throw new Error("Invalid Google Drive folder name.");
  }

  return name;
}

function validateEvidenceDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Invalid evidence date.");
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error("Invalid evidence date.");
  }

  return value;
}

function getParticipantFolderName(
  participantSeatNumber: number | string | null,
): string {
  // A missing seat number is allowed during testing.
  if (
    participantSeatNumber === null ||
    participantSeatNumber === undefined ||
    (typeof participantSeatNumber === "string" &&
      participantSeatNumber.trim() === "")
  ) {
    return "participant-no-seat";
  }

  const seatNumber = String(participantSeatNumber).trim();

  if (!/^\d+$/.test(seatNumber) || Number(seatNumber) < 1) {
    throw new Error("Invalid participant seat number.");
  }

  return `participant-${seatNumber}`;
}

async function findOrCreateFolder(
  drive: Awaited<ReturnType<typeof getGoogleDriveClient>>["drive"],
  folderName: string,
  parentId: string,
): Promise<string> {
  const safeName = validateFolderName(folderName);
  const escapedName = escapeDriveQueryValue(safeName);
  const escapedParentId = escapeDriveQueryValue(parentId);

  const response = await drive.files.list({
    q: [
      `name = '${escapedName}'`,
      `mimeType = '${FOLDER_MIME_TYPE}'`,
      `'${escapedParentId}' in parents`,
      "trashed = false",
    ].join(" and "),
    pageSize: 100,
    orderBy: "createdTime",
    fields: "files(id,name,mimeType)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const existingFolder = response.data.files?.find(
    (file) =>
      Boolean(file.id) &&
      file.name === safeName &&
      file.mimeType === FOLDER_MIME_TYPE,
  );

  if (existingFolder?.id) {
    return existingFolder.id;
  }

  const created = await drive.files.create({
    requestBody: {
      name: safeName,
      mimeType: FOLDER_MIME_TYPE,
      parents: [parentId],
    },
    fields: "id,name,mimeType",
    supportsAllDrives: true,
  });

  if (!created.data.id) {
    throw new Error("Google Drive did not return the new folder ID.");
  }

  return created.data.id;
}

export async function uploadToGoogleDrive({
  fileName,
  mimeType,
  buffer,
  participantSeatNumber,
  evidenceDate,
}: GoogleDriveUploadInput): Promise<GoogleDriveUploadResult> {
  if (!buffer.length) {
    throw new Error("Cannot upload an empty file.");
  }

  const date = validateEvidenceDate(evidenceDate);
  const participantFolderName = getParticipantFolderName(participantSeatNumber);

  const safeFileName = fileName
    .replace(/[\\/]/g, "_")
    .replace(/[\u0000-\u001F\u007F]/g, "_")
    .trim()
    .slice(0, 180);

  if (!safeFileName) {
    throw new Error("Invalid upload filename.");
  }

  const { drive, folderId, storageEmail } = await getGoogleDriveClient();

  // 1. Find or create the date folder under the configured root.
  const dateFolderId = await findOrCreateFolder(drive, date, folderId);

  // 2. Find or create the participant's seat-number folder.
  const participantFolderId = await findOrCreateFolder(
    drive,
    participantFolderName,
    dateFolderId,
  );

  // 3. Upload a clearly marked test image.
  const testFileName = safeFileName.startsWith("TEST-")
    ? safeFileName
    : `TEST-${safeFileName}`;

  const response = await drive.files.create({
    requestBody: {
      name: testFileName,
      description:
        "Uprix Result Room Google Drive integration test. " +
        "This file is not a real participant submission.",
      parents: [participantFolderId],
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: "id,name,webViewLink",
    supportsAllDrives: true,
  });

  const fileId = response.data.id;
  const webViewLink = response.data.webViewLink;

  if (!fileId || !webViewLink) {
    throw new Error(
      "Google Drive did not return the uploaded file ID and viewing link.",
    );
  }

  return {
    fileId,
    webViewLink,
    storageEmail,
    dateFolder: date,
    participantFolder: participantFolderName,
  };
}
