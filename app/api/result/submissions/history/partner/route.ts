import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function json(
  request: NextRequest,
  body: unknown,
  status = 200,
  cookiesToSet: {
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }[] = [],
) {
  const response = NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });

  for (const cookie of cookiesToSet) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return response;
}

export async function GET(request: NextRequest) {
  const cookiesToSet: {
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }[] = [];

  const respond = (body: unknown, status = 200) =>
    json(request, body, status, cookiesToSet);

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            cookies.forEach((cookie) => {
              cookiesToSet.push({
                name: cookie.name,
                value: cookie.value,
                options: cookie.options,
              });
            });
          },
        },
      },
    );

    // 1. Authenticate the current user.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return respond(
        {
          success: false,
          error: "Unauthorized",
        },
        401,
      );
    }

    // 2. Get the current user's participant record.
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, room_id, room_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error(
        "[Partner Submission History] Participant lookup failed:",
        participantError,
      );

      return respond(
        {
          success: false,
          error: "Failed to load participant information",
        },
        500,
      );
    }

    if (!participant) {
      return respond(
        {
          success: false,
          error: "Participant not found",
        },
        404,
      );
    }

    if (participant.room_status !== "active") {
      return respond(
        {
          success: false,
          error: "Your participant account is not active",
        },
        403,
      );
    }

    // 3. Find active partner assignments involving this participant.
    const { data: pairs, error: pairsError } = await supabase
      .from("partner_pairs")
      .select("id, room_id, participant_a_id, participant_b_id, reviewer_id")
      .eq("room_id", participant.room_id)
      .eq("status", "ACTIVE")
      .or(
        `participant_a_id.eq.${participant.id},participant_b_id.eq.${participant.id}`,
      );

    if (pairsError) {
      console.error(
        "[Partner Submission History] Partner lookup failed:",
        pairsError,
      );

      return respond(
        {
          success: false,
          error: "Failed to load partner assignment",
        },
        500,
      );
    }

    // Preserve the same eligibility rules as the current-submission endpoint.
    const eligiblePairs = (pairs ?? []).filter(
      (pair) =>
        pair.reviewer_id === null || pair.reviewer_id === participant.id,
    );

    if (eligiblePairs.length === 0) {
      return respond({
        success: true,
        history: [],
      });
    }

    if (eligiblePairs.length > 1) {
      return respond(
        {
          success: false,
          error: "Multiple active partner assignments found",
          code: "AMBIGUOUS_PARTNER_ASSIGNMENT",
        },
        409,
      );
    }

    const pair = eligiblePairs[0];

    const partnerId =
      pair.participant_a_id === participant.id
        ? pair.participant_b_id
        : pair.participant_a_id;

    // 4. Fetch every submission belonging to this partner in this room.
    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select("id, description, submission_date, submitted_at, status")
      .eq("participant_id", partnerId)
      .eq("room_id", participant.room_id)
      .order("submission_date", { ascending: false })
      .order("submitted_at", { ascending: false });

    if (submissionsError) {
      console.error(
        "[Partner Submission History] Submissions lookup failed:",
        submissionsError,
      );

      return respond(
        {
          success: false,
          error: "Failed to load partner submission history",
        },
        500,
      );
    }

    // 5. Return an empty history if the partner has never submitted.
    if (!submissions || submissions.length === 0) {
      return respond({
        success: true,
        history: [],
      });
    }

    // 6. Fetch the files for all submissions in one query.
    const submissionIds = submissions.map((submission) => submission.id);

    const { data: files, error: filesError } = await supabase
      .from("submission_files")
      .select("id, submission_id, cloudinary_url, created_at")
      .in("submission_id", submissionIds)
      .order("created_at", { ascending: true });

    if (filesError) {
      console.error(
        "[Partner Submission History] Submission files lookup failed:",
        filesError,
      );

      return respond(
        {
          success: false,
          error: "Failed to load partner submission images",
        },
        500,
      );
    }

    // 7. Group each image under its submission.
    const filesBySubmission = new Map<
      string,
      {
        id: string;
        url: string;
      }[]
    >();

    for (const file of files ?? []) {
      const existing = filesBySubmission.get(file.submission_id) ?? [];

      existing.push({
        id: file.id,
        url: file.cloudinary_url,
      });

      filesBySubmission.set(file.submission_id, existing);
    }

    // 8. Build the response in newest-first submission order.
    const history = submissions.map((submission) => ({
      id: submission.id,
      description: submission.description,
      submissionDate: submission.submission_date,
      submittedAt: submission.submitted_at,
      status: submission.status,
      images: filesBySubmission.get(submission.id) ?? [],
    }));
    console.log({ history });
    return respond({
      success: true,
      history,
    });
  } catch (error) {
    console.error("[Partner Submission History] Unexpected error:", error);

    return respond(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      500,
    );
  }
}
