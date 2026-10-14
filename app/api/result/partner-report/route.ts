import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function createSupabaseServerClient(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  return createServerClient(
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
            // Cookie mutation may not be available in this context.
          }
        },
      },
    },
  );
}

function getLocalDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime()) && getLocalDate(date) === value;
}

export async function POST(request: Request) {
  try {
    console.log("Partner report request received", {
      method: request.method,
      url: request.url,
    });

    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    // 1. Authenticate the participant.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const user = claimsData?.claims;

    console.log("Partner report auth check", {
      hasClaims: !!claimsData,
      hasUserSub: !!user?.sub,
      userSub: user?.sub,
      claimsError: claimsError?.message,
    });

    if (claimsError || !user?.sub) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        {
          status: 401,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    // 2. Find the participant.
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, room_id, room_status")
      .eq("user_id", user.sub)
      .maybeSingle();

    if (participantError) {
      console.error(
        "Partner report participant lookup failed:",
        participantError,
      );

      return NextResponse.json(
        { success: false, message: "Could not verify participant." },
        {
          status: 500,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    if (!participant) {
      return NextResponse.json(
        { success: false, message: "Participant not found." },
        {
          status: 404,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    console.log("Partner report participant found", {
      participantId: participant.id,
      roomId: participant.room_id,
      roomStatus: participant.room_status,
    });

    if (participant.room_status !== "active") {
      return NextResponse.json(
        { success: false, message: "Your participation is not active." },
        {
          status: 403,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    // 3. Parse and validate the request body.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        {
          status: 400,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        {
          status: 400,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    const payload = body as {
      date?: unknown;
      comment?: unknown;
      submittedOnTime?: unknown;
    };

    console.log("Partner report payload received", {
      date: payload.date,
      submittedOnTime: payload.submittedOnTime,
      commentLength:
        typeof payload.comment === "string" ? payload.comment.length : null,
    });

    if (typeof payload.date !== "string" || !isValidDateString(payload.date)) {
      return NextResponse.json(
        { success: false, message: "A valid reporting date is required." },
        {
          status: 400,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    // The reviewer must explicitly answer yes or no.
    // false is a valid answer; undefined/null are not.
    if (typeof payload.submittedOnTime !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please confirm whether your partner submitted their task on time.",
        },
        {
          status: 400,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    // 4. Validate the optional comment.
    let comment: string | null = null;

    if (payload.comment !== undefined && payload.comment !== null) {
      if (typeof payload.comment !== "string") {
        return NextResponse.json(
          { success: false, message: "Comment must be text." },
          {
            status: 400,
            headers: { "Cache-Control": "private, no-store" },
          },
        );
      }

      comment = payload.comment.trim() || null;

      if (comment && comment.length > 2000) {
        return NextResponse.json(
          {
            success: false,
            message: "Comment cannot exceed 2000 characters.",
          },
          {
            status: 400,
            headers: { "Cache-Control": "private, no-store" },
          },
        );
      }
    }

    // 5. Use the same server-local date approach as the dashboard route.
    const now = new Date();
    const todayString = getLocalDate(now);

    if (payload.date !== todayString) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only submit a partner report for today.",
        },
        {
          status: 400,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    // Partner reporting closes at 9:30 PM server-local time.
    const deadline = new Date(now);
    deadline.setHours(21, 30, 0, 0);

    if (now.getTime() >= deadline.getTime()) {
      return NextResponse.json(
        {
          success: false,
          message: "Partner reporting is closed for today.",
        },
        {
          status: 403,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    // 6. Find the participant's active partner pair in their room.
    const { data: activePair, error: pairError } = await supabase
      .from("partner_pairs")
      .select("id, participant_a_id, participant_b_id")
      .eq("room_id", participant.room_id)
      .eq("status", "ACTIVE")
      .or(
        `participant_a_id.eq.${participant.id},participant_b_id.eq.${participant.id}`,
      )
      .maybeSingle();

    if (pairError) {
      console.error("Partner report pair lookup failed:", pairError);

      return NextResponse.json(
        { success: false, message: "Could not find your partner." },
        {
          status: 500,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    if (!activePair) {
      return NextResponse.json(
        { success: false, message: "You do not have an active partner pair." },
        {
          status: 404,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    const partnerId =
      activePair.participant_a_id === participant.id
        ? activePair.participant_b_id
        : activePair.participant_a_id;

    console.log("Partner report pair resolved", {
      participantId: participant.id,
      partnerId,
      pairId: activePair.id,
      roomId: participant.room_id,
      reviewDate: todayString,
    });

    // 7. Prevent duplicate reports for the same partner and day.
    const { data: existingReport, error: existingReportError } = await supabase
      .from("partner_reviews")
      .select("id")
      .eq("partner_pair_id", activePair.id)
      .eq("reviewer_id", participant.id)
      .eq("partner_id", partnerId)
      .eq("review_date", todayString)
      .maybeSingle();

    if (existingReportError) {
      console.error(
        "Partner report duplicate check failed:",
        existingReportError,
      );

      return NextResponse.json(
        { success: false, message: "Could not verify today's report." },
        {
          status: 500,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    if (existingReport) {
      console.log("Partner report duplicate detected", {
        participantId: participant.id,
        partnerId,
        pairId: activePair.id,
        reviewDate: todayString,
      });

      return NextResponse.json(
        {
          success: false,
          message: "You have already submitted a partner report today.",
        },
        {
          status: 409,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }
    const { data: reviewerCheck, error: reviewerCheckError } = await supabase
      .from("participants")
      .select("id, user_id, room_id")
      .eq("id", participant.id)
      .maybeSingle();

    const { data: pairCheck, error: pairCheckError } = await supabase
      .from("partner_pairs")
      .select("id, room_id, participant_a_id, participant_b_id, status")
      .eq("id", activePair.id)
      .maybeSingle();

    console.log("RLS reviewer check:", reviewerCheck);
    console.log("RLS reviewer error:", reviewerCheckError);
    console.log("RLS pair check:", pairCheck);
    console.log("RLS pair error:", pairCheckError);

    console.log("Insert condition checks:", {
      authenticatedUserMatchesReviewer:
        reviewerCheck?.user_id ===
        (await supabase.auth.getClaims()).data?.claims?.sub,
      reviewerMatchesInsert: reviewerCheck?.id === participant.id,
      reviewerRoomMatchesPair: reviewerCheck?.room_id === pairCheck?.room_id,
      pairIsActive: pairCheck?.status === "ACTIVE",
      pairContainsReviewer:
        pairCheck?.participant_a_id === participant.id ||
        pairCheck?.participant_b_id === participant.id,
      pairContainsPartner:
        pairCheck?.participant_a_id === partnerId ||
        pairCheck?.participant_b_id === partnerId,
    });
    // 8. Save the report.
    // submitted_on_time records the reviewer's answer about the partner's task.
    const { data: report, error: insertError } = await supabase
      .from("partner_reviews")
      .insert({
        reviewer_id: participant.id,
        partner_id: partnerId,
        partner_pair_id: activePair.id,
        review_date: todayString,
        submitted_on_time: payload.submittedOnTime,
        comment,
      })
      .select(
        "id, reviewer_id, partner_id, partner_pair_id, review_date, submitted_on_time, comment, reviewed_at, created_at",
      )
      .single();

    if (insertError) {
      console.error("Partner report creation failed:", insertError);

      return NextResponse.json(
        { success: false, message: "Failed to submit partner report." },
        {
          status: 500,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    console.log("Partner report insert payload", {
      reviewer_id: participant.id,
      partner_id: partnerId,
      partner_pair_id: activePair.id,
      review_date: todayString,
      submitted_on_time: payload.submittedOnTime,
      comment,
    });

    console.log("Partner report submitted successfully", {
      reportId: report?.id,
      reviewerId: participant.id,
      partnerId,
      reviewDate: todayString,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Partner report submitted successfully.",
        report,
      },
      {
        status: 201,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error) {
    console.error("Unexpected partner report error:", error);

    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      {
        status: 500,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}
