import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getDailySubmissionDeadline } from "@/lib/result-room/deadlines";
import { submissionSchema } from "@/lib/result-room/submission-schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadSubmissionFilesToDrive } from "@/lib/result-room/upload-submission-files";
import { updateSubmissionSchema } from "@/lib/result-room/submission-schema";
import { deleteCloudinaryImage } from "@/lib/cloudinary/delete";
import { deleteGoogleDriveFile } from "@/lib/google/drive-upload-client";

export async function POST(request: Request) {
  try {
    // 1. Parse and validate the request body
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    const validation = submissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid submission data.",
          code: "INVALID_SUBMISSION_PAYLOAD",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { timezone, description, files } = validation.data;

    // 2. Create Supabase server and admin clients
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Cookie mutation may fail in some server contexts.
            }
          },
        },
      },
    );

    const adminSupabase = createAdminClient();

    // 3. Authenticate the participant
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims?.sub) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const userId = claimsData.claims.sub;

    // 4. Get the participant
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, room_id, room_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error("Submission participant lookup error:", participantError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load participant.",
        },
        { status: 500 },
      );
    }

    if (!participant) {
      return NextResponse.json(
        {
          success: false,
          error: "Participant not found.",
        },
        { status: 404 },
      );
    }

    // 5. Participant must be active
    if (participant.room_status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: "Only active participants can submit tasks.",
        },
        { status: 403 },
      );
    }

    // 6. Validate the timezone
    try {
      new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
      });
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid participant timezone.",
        },
        { status: 400 },
      );
    }

    // 7. Check today's submission deadline
    const now = new Date();

    const submissionDeadline = getDailySubmissionDeadline(timezone, now);

    if (!submissionDeadline.isOpen) {
      return NextResponse.json(
        {
          success: false,
          error: "Today's task submission deadline has passed.",
          code: "SUBMISSION_DEADLINE_PASSED",
          deadline: submissionDeadline.deadline.toISOString(),
          localDate: submissionDeadline.localDate,
          timezone: submissionDeadline.timezone,
        },
        { status: 403 },
      );
    }

    const submissionDate = submissionDeadline.localDate;

    // 8. Check for an existing submission today
    const { data: existingSubmission, error: existingSubmissionError } =
      await supabase
        .from("submissions")
        .select("id")
        .eq("participant_id", participant.id)
        .eq("submission_date", submissionDate)
        .maybeSingle();

    if (existingSubmissionError) {
      console.error(
        "Submission duplicate check error:",
        existingSubmissionError,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify today's submission.",
        },
        { status: 500 },
      );
    }

    if (existingSubmission) {
      return NextResponse.json(
        {
          success: false,
          error: "You have already submitted today's task.",
          code: "SUBMISSION_ALREADY_EXISTS",
        },
        { status: 409 },
      );
    }

    // 9. Create the submission
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        participant_id: participant.id,
        room_id: participant.room_id,
        submission_date: submissionDate,
        description: description || null,
      })
      .select(
        `
          id,
          participant_id,
          room_id,
          submission_date,
          description,
          submitted_at,
          status
        `,
      )
      .single();

    if (submissionError) {
      // The database unique constraint protects against concurrent
      // requests that both pass the duplicate check above.
      if (submissionError.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "You have already submitted today's task.",
            code: "SUBMISSION_ALREADY_EXISTS",
          },
          { status: 409 },
        );
      }

      console.error("Submission creation error:", submissionError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to create submission.",
        },
        { status: 500 },
      );
    }

    // 10. Create submission_files rows
    const submissionFiles = files.map((file) => ({
      submission_id: submission.id,
      cloudinary_public_id: file.publicId,
      cloudinary_url: file.secureUrl,
    }));

    const { data: createdFiles, error: submissionFilesError } =
      await adminSupabase.from("submission_files").insert(submissionFiles)
        .select(`
        id,
        submission_id,
        cloudinary_public_id,
        cloudinary_url,
        google_drive_file_id,
        google_drive_url,
        google_drive_status,
        created_at
      `);

    if (submissionFilesError) {
      console.error("Submission files creation error:", submissionFilesError);

      return NextResponse.json(
        {
          success: false,
          error: "Submission files could not be saved.",
        },
        { status: 500 },
      );
    }

    // 11. Attempt Google Drive uploads.
    // The submission and Cloudinary metadata are already saved.
    // Drive failures must not invalidate the saved submission.
    let responseFiles = createdFiles;

    if (createdFiles.length > 0) {
      try {
        const results = await uploadSubmissionFilesToDrive(
          createdFiles.map((file) => file.id),
        );

        const failedCount = results.filter((result) => !result.success).length;

        if (failedCount > 0) {
          console.error(
            `${failedCount} submission file(s) still need Google Drive uploads.`,
          );
        }

        // Read the latest Drive status for the response.
        const { data: refreshedFiles, error: refreshError } =
          await adminSupabase
            .from("submission_files")
            .select(
              `
            id,
            submission_id,
            cloudinary_public_id,
            cloudinary_url,
            google_drive_file_id,
            google_drive_url,
            google_drive_status,
            created_at
          `,
            )
            .in(
              "id",
              createdFiles.map((file) => file.id),
            )
            .order("created_at", { ascending: true });

        if (refreshError) {
          console.error(
            "Unable to refresh Drive upload statuses:",
            refreshError.message,
          );
        } else if (refreshedFiles) {
          responseFiles = refreshedFiles;
        }
      } catch (error) {
        console.error(
          "Drive upload processing error:",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }

    // 12. Return the saved submission
    return NextResponse.json(
      {
        success: true,
        message: "Submission created successfully.",

        submission: {
          id: submission.id,
          participantId: submission.participant_id,
          roomId: submission.room_id,
          submissionDate: submission.submission_date,
          description: submission.description,
          submittedAt: submission.submitted_at,
          status: submission.status,
        },

        files: responseFiles.map((file) => ({
          id: file.id,
          submissionId: file.submission_id,
          cloudinaryPublicId: file.cloudinary_public_id,
          cloudinaryUrl: file.cloudinary_url,
          googleDriveFileId: file.google_drive_file_id,
          googleDriveUrl: file.google_drive_url,
          googleDriveStatus: file.google_drive_status,
          createdAt: file.created_at,
        })),

        timezone,
        deadline: submissionDeadline.deadline.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Result Room submission API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    // 1. Parse and validate the update payload.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 },
      );
    }

    const validation = updateSubmissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid submission update data.",
          code: "INVALID_SUBMISSION_PAYLOAD",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { timezone, description, retainedFileIds, newFiles } =
      validation.data;

    // 2. Authenticate the participant using the existing SSR pattern.
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Cookie mutation may fail in some server contexts.
            }
          },
        },
      },
    );

    const adminSupabase = createAdminClient();

    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims?.sub) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 },
      );
    }

    const userId = claimsData.claims.sub;

    // 3. Require an active participant.
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, room_id, room_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error(
        "Submission update participant lookup error:",
        participantError,
      );

      return NextResponse.json(
        { success: false, error: "Unable to load participant." },
        { status: 500 },
      );
    }

    if (!participant) {
      return NextResponse.json(
        { success: false, error: "Participant not found." },
        { status: 404 },
      );
    }

    if (participant.room_status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: "Only active participants can update submissions.",
        },
        { status: 403 },
      );
    }

    // 4. Validate timezone and enforce the submission deadline.
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid participant timezone." },
        { status: 400 },
      );
    }

    const submissionDeadline = getDailySubmissionDeadline(timezone, new Date());

    if (!submissionDeadline.isOpen) {
      return NextResponse.json(
        {
          success: false,
          error: "Today's task submission deadline has passed.",
          code: "SUBMISSION_DEADLINE_PASSED",
          deadline: submissionDeadline.deadline.toISOString(),
          localDate: submissionDeadline.localDate,
          timezone: submissionDeadline.timezone,
        },
        { status: 403 },
      );
    }

    const submissionDate = submissionDeadline.localDate;

    // 5. Find today's existing submission.
    const { data: submission, error: submissionLookupError } =
      await adminSupabase
        .from("submissions")
        .select(
          `
            id,
            participant_id,
            room_id,
            submission_date,
            description,
            submitted_at,
            status
          `,
        )
        .eq("participant_id", participant.id)
        .eq("submission_date", submissionDate)
        .maybeSingle();

    if (submissionLookupError) {
      console.error("Submission update lookup error:", submissionLookupError);

      return NextResponse.json(
        { success: false, error: "Unable to load today's submission." },
        { status: 500 },
      );
    }

    if (!submission) {
      return NextResponse.json(
        {
          success: false,
          error: "No submission exists for today to update.",
          code: "SUBMISSION_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    // 6. Load the authoritative image records for this submission.
    const { data: currentFiles, error: currentFilesError } = await adminSupabase
      .from("submission_files")
      .select(
        `
            id,
            submission_id,
            cloudinary_public_id,
            cloudinary_url,
            google_drive_file_id,
            google_drive_url,
            google_drive_status,
            created_at
          `,
      )
      .eq("submission_id", submission.id);

    if (currentFilesError) {
      console.error("Submission update file lookup error:", currentFilesError);

      return NextResponse.json(
        { success: false, error: "Unable to load submission images." },
        { status: 500 },
      );
    }

    const existingFiles = currentFiles ?? [];
    const existingFileIds = new Set(existingFiles.map((file) => file.id));

    // Never allow the client to retain a file from another submission.
    if (retainedFileIds.some((id) => !existingFileIds.has(id))) {
      return NextResponse.json(
        {
          success: false,
          error:
            "One or more selected images do not belong to this submission.",
          code: "INVALID_RETAINED_FILE",
        },
        { status: 400 },
      );
    }

    const retainedIds = new Set(retainedFileIds);

    // The server, not the client, determines which images are removed.
    const removedFiles = existingFiles.filter(
      (file) => !retainedIds.has(file.id),
    );

    // 7. Insert database records for newly uploaded Cloudinary images.
    let createdFiles: typeof existingFiles = [];

    if (newFiles.length > 0) {
      const { data: insertedFiles, error: insertFilesError } =
        await adminSupabase
          .from("submission_files")
          .insert(
            newFiles.map((file) => ({
              submission_id: submission.id,
              cloudinary_public_id: file.publicId,
              cloudinary_url: file.secureUrl,
            })),
          )
          .select(
            `
              id,
              submission_id,
              cloudinary_public_id,
              cloudinary_url,
              google_drive_file_id,
              google_drive_url,
              google_drive_status,
              created_at
            `,
          );

      if (insertFilesError || !insertedFiles) {
        console.error(
          "Submission update file insertion error:",
          insertFilesError,
        );

        return NextResponse.json(
          {
            success: false,
            error: "New submission images could not be saved.",
          },
          { status: 500 },
        );
      }

      createdFiles = insertedFiles;
    }

    // 8. Update only the description.
    // Preserve submission ID, date, submitted_at, and status.
    const { data: updatedSubmission, error: updateError } = await adminSupabase
      .from("submissions")
      .update({ description: description || null })
      .eq("id", submission.id)
      .eq("participant_id", participant.id)
      .eq("submission_date", submissionDate)
      .select(
        `
            id,
            participant_id,
            room_id,
            submission_date,
            description,
            submitted_at,
            status
          `,
      )
      .maybeSingle();

    if (updateError || !updatedSubmission) {
      console.error("Submission update error:", updateError);

      // Best-effort rollback of the new database rows.
      // Do not delete Cloudinary assets based on unverified client IDs.
      if (createdFiles.length > 0) {
        const { error: rollbackError } = await adminSupabase
          .from("submission_files")
          .delete()
          .eq("submission_id", submission.id)
          .in(
            "id",
            createdFiles.map((file) => file.id),
          );

        if (rollbackError) {
          console.error("Submission update rollback error:", rollbackError);
        }
      }

      return NextResponse.json(
        { success: false, error: "Unable to update submission." },
        { status: 500 },
      );
    }

    // 9. Delete removed database rows.
    // We already captured the trusted Cloudinary and Drive IDs above.
    let deletedFiles: typeof existingFiles = [];

    if (removedFiles.length > 0) {
      const { data: deletedRows, error: deleteRowsError } = await adminSupabase
        .from("submission_files")
        .delete()
        .eq("submission_id", submission.id)
        .in(
          "id",
          removedFiles.map((file) => file.id),
        )
        .select(
          `
              id,
              submission_id,
              cloudinary_public_id,
              cloudinary_url,
              google_drive_file_id,
              google_drive_url,
              google_drive_status,
              created_at
            `,
        );

      if (deleteRowsError || !deletedRows) {
        console.error(
          "Removed submission file records could not be deleted:",
          deleteRowsError,
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "The submission description was updated, but removed images could not be fully processed. Reload the submission before retrying.",
            code: "IMAGE_REMOVAL_INCOMPLETE",
          },
          { status: 500 },
        );
      }

      deletedFiles = deletedRows;
    }

    // 10. Clean up external assets using IDs read from trusted database rows.
    // Asset cleanup failures do not undo the already-saved submission update.
    const cleanupResults = await Promise.allSettled(
      deletedFiles.flatMap((file) => {
        const tasks: Promise<void>[] = [];

        if (file.cloudinary_public_id) {
          tasks.push(deleteCloudinaryImage(file.cloudinary_public_id));
        }

        if (file.google_drive_file_id) {
          tasks.push(deleteGoogleDriveFile(file.google_drive_file_id));
        }

        return tasks;
      }),
    );

    const cleanupFailures = cleanupResults.filter(
      (result) => result.status === "rejected",
    );

    if (cleanupFailures.length > 0) {
      console.error(
        `${cleanupFailures.length} removed submission asset(s) could not be deleted.`,
        cleanupFailures.map((result) =>
          result.status === "rejected"
            ? result.reason instanceof Error
              ? result.reason.message
              : String(result.reason)
            : undefined,
        ),
      );
    }

    // 11. Upload only the newly added images through the existing flow.
    // The Google Drive worker itself is not modified.
    if (createdFiles.length > 0) {
      try {
        const results = await uploadSubmissionFilesToDrive(
          createdFiles.map((file) => file.id),
        );

        const failedCount = results.filter((result) => !result.success).length;

        if (failedCount > 0) {
          console.error(
            `${failedCount} newly added submission image(s) still need Google Drive uploads.`,
          );
        }
      } catch (error) {
        console.error(
          "New submission image Drive upload processing error:",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }

    // 12. Return the latest saved image metadata.
    const { data: responseFiles, error: responseFilesError } =
      await adminSupabase
        .from("submission_files")
        .select(
          `
            id,
            submission_id,
            cloudinary_public_id,
            cloudinary_url,
            google_drive_file_id,
            google_drive_url,
            google_drive_status,
            created_at
          `,
        )
        .eq("submission_id", submission.id)
        .order("created_at", { ascending: true });

    if (responseFilesError) {
      console.error(
        "Updated submission image refresh error:",
        responseFilesError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Submission was updated, but its image metadata could not be refreshed. Reload the submission.",
          code: "SUBMISSION_REFRESH_FAILED",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Submission updated successfully.",
      cleanupWarning:
        cleanupFailures.length > 0
          ? "Some removed external assets could not be deleted. Check the server logs."
          : null,
      submission: {
        id: updatedSubmission.id,
        participantId: updatedSubmission.participant_id,
        roomId: updatedSubmission.room_id,
        submissionDate: updatedSubmission.submission_date,
        description: updatedSubmission.description,
        submittedAt: updatedSubmission.submitted_at,
        status: updatedSubmission.status,
      },
      files: (responseFiles ?? []).map((file) => ({
        id: file.id,
        submissionId: file.submission_id,
        cloudinaryPublicId: file.cloudinary_public_id,
        cloudinaryUrl: file.cloudinary_url,
        googleDriveFileId: file.google_drive_file_id,
        googleDriveUrl: file.google_drive_url,
        googleDriveStatus: file.google_drive_status,
        createdAt: file.created_at,
      })),
      timezone,
      deadline: submissionDeadline.deadline.toISOString(),
    });
  } catch (error) {
    console.error("Result Room submission update API error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 },
    );
  }
}
