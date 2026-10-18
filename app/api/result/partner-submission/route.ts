import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const json = (body: Record<string, unknown>, status = 200) => {
    const response = NextResponse.json(body, {
      status,
      headers: {
        "Cache-Control": "private, no-store",
      },
    });

    // Preserve refreshed Supabase session cookies.
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });

    return response;
  };

  try {
    // 1. Authenticate the current user.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return json({ success: false, error: "Unauthorized." }, 401);
    }

    // 2. Validate the requested calendar date.
    const date = request.nextUrl.searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json(
        {
          success: false,
          error: "A valid date in YYYY-MM-DD format is required.",
        },
        400,
      );
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      return json({ success: false, error: "Invalid calendar date." }, 400);
    }

    // 3. Find the authenticated user's participant record.
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, room_id, room_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error(
        "Error fetching partner-submission participant:",
        participantError,
      );

      return json(
        { success: false, error: "Unable to load participant." },
        500,
      );
    }

    if (!participant) {
      return json({ success: false, error: "Participant not found." }, 404);
    }

    if (participant.room_status !== "active") {
      return json(
        {
          success: false,
          error: "An active Result Room participant is required.",
        },
        403,
      );
    }

    // 4. Fetch every active assignment for this participant
    // within their own room.
    const { data: activePairs, error: pairError } = await supabase
      .from("partner_pairs")
      .select("id, room_id, participant_a_id, participant_b_id, reviewer_id")
      .eq("room_id", participant.room_id)
      .eq("status", "ACTIVE")
      .or(
        `participant_a_id.eq.${participant.id},participant_b_id.eq.${participant.id}`,
      );

    if (pairError) {
      console.error("Error fetching active partner pairs:", pairError);

      return json(
        { success: false, error: "Unable to load partner details." },
        500,
      );
    }

    // 5. Resolve the assignment this participant is authorized
    // to review.
    //
    // Mutual assignment: reviewer_id is NULL.
    // Directional assignment: reviewer_id must be this participant.
    const eligiblePairs = (activePairs ?? []).filter(
      (pair) =>
        pair.reviewer_id === null || pair.reviewer_id === participant.id,
    );

    if (eligiblePairs.length === 0) {
      return json({
        success: true,
        submission: null,
      });
    }

    // Never silently choose the wrong partner if the assignments
    // are ambiguous.
    if (eligiblePairs.length > 1) {
      console.error("Ambiguous partner-submission assignment:", {
        participantId: participant.id,
        roomId: participant.room_id,
        pairIds: eligiblePairs.map((pair) => pair.id),
      });

      return json(
        {
          success: false,
          error:
            "Multiple eligible partner assignments found. Please contact an administrator.",
          code: "AMBIGUOUS_PARTNER_ASSIGNMENT",
        },
        409,
      );
    }

    const pair = eligiblePairs[0];

    // 6. Determine the participant whose submission must be reviewed.
    const partnerId =
      pair.participant_a_id === participant.id
        ? pair.participant_b_id
        : pair.participant_a_id;

    // 7. Fetch that participant's submission for the requested date.
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, description, submission_date, submitted_at, status")
      .eq("participant_id", partnerId)
      .eq("room_id", participant.room_id)
      .eq("submission_date", date)
      .maybeSingle();

    if (submissionError) {
      console.error("Error fetching partner submission:", submissionError);

      return json(
        {
          success: false,
          error: "Unable to load the partner's submission.",
        },
        500,
      );
    }

    // A partner may not have submitted for the requested date.
    if (!submission) {
      return json({
        success: true,
        submission: null,
      });
    }

    // 8. Fetch every image associated with this submission.
    const { data: files, error: filesError } = await supabase
      .from("submission_files")
      .select("id, cloudinary_url, created_at")
      .eq("submission_id", submission.id)
      .order("created_at", { ascending: true });

    if (filesError) {
      console.error("Error fetching partner submission images:", filesError);

      return json(
        {
          success: false,
          error: "Unable to load submission images.",
        },
        500,
      );
    }

    const images = (files ?? []).map((file) => ({
      id: file.id,
      url: file.cloudinary_url,
    }));

    // 9. Return the submission in the existing response format.
    return json({
      success: true,
      submission: {
        id: submission.id,
        description: submission.description,
        submissionDate: submission.submission_date,
        submittedAt: submission.submitted_at,
        status: submission.status,
        images,
      },
    });
  } catch (error) {
    console.error("Unexpected error in partner-submission API:", error);

    return json(
      {
        success: false,
        error: "Internal server error.",
      },
      500,
    );
  }
}
