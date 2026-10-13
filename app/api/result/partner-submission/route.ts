import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/result/partner-submission?date=YYYY-MM-DD
 *
 * Returns the authenticated participant's active partner's
 * submission and all images associated with that submission.
 *
 * The client cannot choose an arbitrary participant or submission.
 */
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
      headers: { "Cache-Control": "no-store" },
    });

    // Preserve any refreshed Supabase session cookies.
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });

    return response;
  };

  try {
    console.log("Partner submission request received", {
      url: request.url,
      date: request.nextUrl.searchParams.get("date"),
    });

    // 1. Authenticate the current user.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const user = claimsData?.claims;

    console.log("Partner submission auth check", {
      hasClaims: !!claimsData,
      hasUserSub: !!user?.sub,
      userSub: user?.sub,
      claimsError: claimsError?.message,
    });

    if (claimsError || !user?.sub) {
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

    console.log("Partner submission date validated", { date });

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
      .select("id, room_status")
      .eq("user_id", user.sub)
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

    console.log("Partner submission participant resolved", {
      participantId: participant.id,
      roomStatus: participant.room_status,
    });

    if (participant.room_status !== "active") {
      return json(
        {
          success: false,
          error: "An active Result Room participant is required.",
        },
        403,
      );
    }

    // 4. Find the participant's active partner pair.
    const { data: pair, error: pairError } = await supabase
      .from("partner_pairs")
      .select("id, room_id, participant_a_id, participant_b_id")
      .eq("status", "ACTIVE")
      .or(
        `participant_a_id.eq.${participant.id},participant_b_id.eq.${participant.id}`,
      )
      .maybeSingle();

    if (pairError) {
      console.error("Error fetching active partner pair:", pairError);

      return json(
        { success: false, error: "Unable to load partner details." },
        500,
      );
    }

    if (!pair) {
      console.log("Partner submission no active pair found", {
        participantId: participant.id,
        date,
      });

      return json({
        success: true,
        submission: null,
      });
    }

    // Determine the other participant exclusively from the pair.
    const partnerId =
      pair.participant_a_id === participant.id
        ? pair.participant_b_id
        : pair.participant_a_id;

    console.log("Partner submission active pair resolved", {
      participantId: participant.id,
      partnerId,
      pairId: pair.id,
      roomId: pair.room_id,
      date,
    });

    // 5. Find that partner's submission for the requested day.
    // The pair's room_id prevents cross-room lookups.
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, description, submission_date, submitted_at, status")
      .eq("participant_id", partnerId)
      .eq("room_id", pair.room_id)
      .eq("submission_date", date)
      .maybeSingle();
    console.log("submission query executed", submission);
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

    // A missing submission is a normal state, not a server error.
    if (!submission) {
      console.log("Partner submission not found for date", {
        participantId: participant.id,
        partnerId,
        date,
      });

      return json({
        success: true,
        submission: null,
      });
    }

    console.log("Partner submission found", {
      submissionId: submission.id,
      partnerId,
      date,
      imageCount: 0,
    });

    // 6. Each image has its own submission_files row.
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

    console.log("Partner submission response built", {
      submissionId: submission.id,
      imageCount: images.length,
      date,
    });

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

    return json({ success: false, error: "Internal server error." }, 500);
  }
}
