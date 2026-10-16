import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate the current user.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 },
      );
    }

    // 2. Validate pagination parameters.
    const searchParams = request.nextUrl.searchParams;

    const rawPage = searchParams.get("page");
    const rawLimit = searchParams.get("limit");

    const page = rawPage === null ? 1 : Number(rawPage);
    const requestedLimit = rawLimit === null ? DEFAULT_LIMIT : Number(rawLimit);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(requestedLimit) ||
      requestedLimit < 1
    ) {
      return NextResponse.json(
        { error: "Page and limit must be positive integers." },
        { status: 400 },
      );
    }

    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to)) {
      return NextResponse.json(
        { error: "The requested page is too large." },
        { status: 400 },
      );
    }

    // 3. Find the participant associated with this account.
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, room_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error(
        "Submission history participant lookup failed:",
        participantError,
      );

      return NextResponse.json(
        { error: "Unable to load your participant record." },
        { status: 500 },
      );
    }

    if (!participant) {
      return NextResponse.json(
        { error: "Participant record not found." },
        { status: 404 },
      );
    }

    // 4. Fetch one page of submissions.
    // The exact count allows the frontend to calculate page information.
    const {
      data: submissions,
      error: submissionsError,
      count,
    } = await supabase
      .from("submissions")
      .select(
        `
          id,
          participant_id,
          room_id,
          submission_date,
          description,
          submitted_at,
          created_at,
          updated_at,
          status
        `,
        { count: "exact" },
      )
      .eq("participant_id", participant.id)
      .eq("room_id", participant.room_id)
      .order("submitted_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    if (submissionsError) {
      console.error("Submission history query failed:", submissionsError);

      return NextResponse.json(
        { error: "Unable to load your submission history." },
        { status: 500 },
      );
    }

    const submissionRows = submissions ?? [];
    const total = count ?? 0;

    // 5. Fetch files for this page in a single query.
    const submissionIds = submissionRows.map((submission) => submission.id);

    const filesBySubmission = new Map<
      string,
      Array<{
        id: string;
        cloudinary_public_id: string;
        cloudinary_url: string;
        google_drive_file_id: string | null;
        google_drive_url: string | null;
        google_drive_status: string;
        created_at: string;
      }>
    >();

    if (submissionIds.length > 0) {
      const { data: files, error: filesError } = await supabase
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
        .in("submission_id", submissionIds)
        .order("created_at", { ascending: true });

      if (filesError) {
        console.error("Submission history files query failed:", filesError);

        return NextResponse.json(
          { error: "Unable to load your submission files." },
          { status: 500 },
        );
      }

      for (const file of files ?? []) {
        const existing = filesBySubmission.get(file.submission_id) ?? [];

        existing.push({
          id: file.id,
          cloudinary_public_id: file.cloudinary_public_id,
          cloudinary_url: file.cloudinary_url,
          google_drive_file_id: file.google_drive_file_id,
          google_drive_url: file.google_drive_url,
          google_drive_status: file.google_drive_status,
          created_at: file.created_at,
        });

        filesBySubmission.set(file.submission_id, existing);
      }
    }

    // 6. Attach each submission's files to its submission record.
    const history = submissionRows.map((submission) => ({
      ...submission,
      files: filesBySubmission.get(submission.id) ?? [],
    }));

    return NextResponse.json({
      submissions: history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: from + submissionRows.length < total,
      },
    });
  } catch (error) {
    console.error("Unexpected submission history error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
