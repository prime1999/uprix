import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getDailySubmissionDeadline } from "@/lib/result-room/deadlines";
import { submissionSchema } from "@/lib/result-room/submission-schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadSubmissionFilesToDrive } from "@/lib/result-room/upload-submission-files";

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
