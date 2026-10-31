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

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });

    return true;
  } catch {
    return false;
  }
}

function getDateInTimezone(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

type ActivePair = {
  id: string;
  participant_a_id: string;
  participant_b_id: string;
  reviewer_id: string | null;
};

export async function GET(request: Request) {
  const responseHeaders = {
    "Cache-Control": "private, no-store",
  };

  try {
    const timezone = request.headers.get("x-time-zone");

    if (!timezone || !isValidTimezone(timezone)) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid browser timezone is required.",
          code: "INVALID_TIMEZONE",
        },
        { status: 400, headers: responseHeaders },
      );
    }

    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    // 1. Authenticate.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const user = claimsData?.claims;

    if (claimsError || !user?.sub) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401, headers: responseHeaders },
      );
    }

    // 2. Fetch profile and participant.
    const [profileResult, participantResult] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("user_id, full_name, gender, avatar_url")
        .eq("user_id", user.sub)
        .maybeSingle(),

      supabase
        .from("participants")
        .select(
          `
            id,
            room_id,
            room_status,
            full_name,
            email,
            phone,
            goal,
            is_admin,
            admin_role,
            status_reason,
            status_changed_at,
            timezone,
            grace_slots_used,
            eviction_stage
          `,
        )
        .eq("user_id", user.sub)
        .maybeSingle(),
    ]);

    if (profileResult.error) {
      console.error("Dashboard profile error:", profileResult.error);

      return NextResponse.json(
        { success: false, error: "Failed to load profile" },
        { status: 500, headers: responseHeaders },
      );
    }

    if (participantResult.error) {
      console.error("Dashboard participant error:", participantResult.error);

      return NextResponse.json(
        { success: false, error: "Failed to load participant" },
        { status: 500, headers: responseHeaders },
      );
    }

    // IMPORTANT: Narrow the nullable type before accessing participant.id.
    const participantData = participantResult.data;

    if (participantData === null) {
      return NextResponse.json(
        {
          success: false,
          error: "Result Room participant not found",
        },
        { status: 404, headers: responseHeaders },
      );
    }

    const participant = participantData;

    // 3. Update the participant's timezone when it changes.
    if (participant.timezone !== timezone) {
      const { error: timezoneUpdateError } = await supabase
        .from("participants")
        .update({ timezone })
        .eq("id", participant.id)
        .eq("user_id", user.sub);

      if (timezoneUpdateError) {
        console.error("Dashboard timezone update error:", timezoneUpdateError);

        return NextResponse.json(
          {
            success: false,
            error: "Failed to update participant timezone",
          },
          { status: 500, headers: responseHeaders },
        );
      }
    }

    // 4. Fetch room.
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, name, description, status, start_date, end_date")
      .eq("id", participant.room_id)
      .maybeSingle();

    if (roomError || !room) {
      console.error("Dashboard room error:", roomError);

      return NextResponse.json(
        { success: false, error: "Result Room not found" },
        { status: 404, headers: responseHeaders },
      );
    }

    // 5. Calculate today's date in the browser's timezone.
    const now = new Date();
    const nowTimestamp = now.getTime();
    const todayString = getDateInTimezone(now, timezone);

    // 6. Fetch today's submission, activity, violations, and fines.
    const [
      todaySubmissionResult,
      submissionActivityResult,
      violationResult,
      fineResult,
      fineCountResult,
    ] = await Promise.all([
      // Today's submission.
      supabase
        .from("submissions")
        .select("id")
        .eq("participant_id", participant.id)
        .eq("submission_date", todayString)
        .maybeSingle(),

      // Submission activity within the room period.
      supabase
        .from("submissions")
        .select("submission_date")
        .eq("participant_id", participant.id)
        .gte("submission_date", room.start_date)
        .lte("submission_date", room.end_date)
        .order("submission_date", { ascending: true }),

      // Count unresolved violations in the current room.
      supabase
        .from("violations")
        .select("id", { count: "exact", head: true })
        .eq("participant_id", participant.id)
        .eq("room_id", participant.room_id)
        .is("resolved_at", null),

      // Fetch unpaid fines in the current room.
      // created_at is needed for the 48-hour fallback deadline.
      supabase
        .from("fines")
        .select("id, status, due_at, created_at")
        .eq("participant_id", participant.id)
        .eq("room_id", participant.room_id)
        .eq("status", "UNPAID"),

      // Count all fines in the current room, regardless of status.
      supabase
        .from("fines")
        .select("id", { count: "exact", head: true })
        .eq("participant_id", participant.id)
        .eq("room_id", participant.room_id),
    ]);

    if (
      todaySubmissionResult.error ||
      submissionActivityResult.error ||
      violationResult.error ||
      fineResult.error ||
      fineCountResult.error
    ) {
      console.error("Dashboard activity/fine query errors:", {
        todaySubmissionError: todaySubmissionResult.error,
        activityError: submissionActivityResult.error,
        violationError: violationResult.error,
        fineError: fineResult.error,
        fineCountError: fineCountResult.error,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Failed to load dashboard activity",
        },
        { status: 500, headers: responseHeaders },
      );
    }
    console.log("ACCOUNTABILITY DEBUG - QUERY RESULTS", {
      violations: {
        count: violationResult.count,
        data: violationResult.data,
        error: violationResult.error,
      },

      unpaidFines: {
        data: fineResult.data,
        error: fineResult.error,
      },

      totalFines: {
        count: fineCountResult.count,
        data: fineCountResult.data,
        error: fineCountResult.error,
      },
    });

    // 7. Calculate accountability.
    const unpaidFines = fineResult.data ?? [];

    const totalFineCount = fineCountResult.count ?? 0;

    // A violation exists if at least one unresolved violation exists.
    const hasViolation = (violationResult.count ?? 0) > 0;

    // Match the deadline fallback used by process_fine_enforcement:
    // due_at, or created_at + 48 hours when due_at is NULL.
    const getFineDeadline = (fine: {
      due_at: string | null;
      created_at: string;
    }): number => {
      return fine.due_at
        ? new Date(fine.due_at).getTime()
        : new Date(fine.created_at).getTime() + 48 * 60 * 60 * 1000;
    };

    const hasPendingFine = unpaidFines.some((fine) => {
      return getFineDeadline(fine) > nowTimestamp;
    });

    const hasOverdueFine = unpaidFines.some((fine) => {
      return getFineDeadline(fine) <= nowTimestamp;
    });

    // 8. Resolve partner assignments.
    const { data: activePairs, error: activePairsError } = await supabase
      .from("partner_pairs")
      .select("id, participant_a_id, participant_b_id, reviewer_id")
      .eq("room_id", participant.room_id)
      .eq("status", "ACTIVE")
      .or(
        `participant_a_id.eq.${participant.id},participant_b_id.eq.${participant.id}`,
      );

    if (activePairsError) {
      console.error("Dashboard active partner pairs error:", activePairsError);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to load partner information",
        },
        { status: 500, headers: responseHeaders },
      );
    }

    const pairs: ActivePair[] = activePairs ?? [];

    function getOtherParticipantId(pair: ActivePair): string {
      return pair.participant_a_id === participant.id
        ? pair.participant_b_id
        : pair.participant_a_id;
    }

    // Mutual pair: either member can review the other.
    // Directional pair: reviewer_id identifies who may review.
    const pairsToReview = pairs.filter(
      (pair) =>
        pair.reviewer_id === null || pair.reviewer_id === participant.id,
    );

    const pairsReviewingMe = pairs.filter((pair) => {
      if (pair.reviewer_id === null) {
        return true;
      }

      return pair.reviewer_id === getOtherParticipantId(pair);
    });

    if (pairsToReview.length > 1 || pairsReviewingMe.length > 1) {
      console.error("Ambiguous partner assignment:", {
        participantId: participant.id,
        pairsToReview: pairsToReview.map((pair) => pair.id),
        pairsReviewingMe: pairsReviewingMe.map((pair) => pair.id),
      });

      return NextResponse.json(
        {
          success: false,
          error:
            "Multiple partner assignments were found. Please contact an administrator.",
          code: "AMBIGUOUS_PARTNER_ASSIGNMENT",
        },
        { status: 409, headers: responseHeaders },
      );
    }

    const reviewPair = pairsToReview[0] ?? null;
    const incomingPair = pairsReviewingMe[0] ?? null;

    const partnerToReviewId = reviewPair
      ? getOtherParticipantId(reviewPair)
      : null;

    const reviewerId = incomingPair
      ? getOtherParticipantId(incomingPair)
      : null;

    // 9. Fetch today's partner submission and both report statuses.
    const [
      partnerSubmissionResult,
      myPartnerReportResult,
      reviewerReportResult,
    ] = await Promise.all([
      partnerToReviewId
        ? supabase
            .from("submissions")
            .select("id")
            .eq("participant_id", partnerToReviewId)
            .eq("room_id", participant.room_id)
            .eq("submission_date", todayString)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),

      reviewPair && partnerToReviewId
        ? supabase
            .from("partner_reviews")
            .select("id")
            .eq("partner_pair_id", reviewPair.id)
            .eq("reviewer_id", participant.id)
            .eq("partner_id", partnerToReviewId)
            .eq("review_date", todayString)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),

      incomingPair && reviewerId
        ? supabase
            .from("partner_reviews")
            .select("id")
            .eq("partner_pair_id", incomingPair.id)
            .eq("reviewer_id", reviewerId)
            .eq("partner_id", participant.id)
            .eq("review_date", todayString)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (
      partnerSubmissionResult.error ||
      myPartnerReportResult.error ||
      reviewerReportResult.error
    ) {
      console.error("Dashboard partner status errors:", {
        partnerSubmissionError: partnerSubmissionResult.error,
        myPartnerReportError: myPartnerReportResult.error,
        reviewerReportError: reviewerReportResult.error,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Failed to load partner reporting status",
        },
        { status: 500, headers: responseHeaders },
      );
    }

    const partnerSubmissionSubmitted = Boolean(partnerSubmissionResult.data);

    const partnerReviewSubmitted = Boolean(myPartnerReportResult.data);

    const reviewerReportSubmitted = Boolean(reviewerReportResult.data);

    const partner = partnerToReviewId
      ? {
          id: partnerToReviewId,
          submissionSubmitted: partnerSubmissionSubmitted,
        }
      : null;

    const partnerToReview = partnerToReviewId
      ? {
          id: partnerToReviewId,
          submissionSubmitted: partnerSubmissionSubmitted,
          reportSubmitted: partnerReviewSubmitted,
        }
      : null;

    const reviewer = reviewerId
      ? {
          id: reviewerId,
          reportSubmitted: reviewerReportSubmitted,
        }
      : null;

    // 10. Return the dashboard response.
    return NextResponse.json(
      {
        success: true,

        profile: {
          id: user.sub,
          email: typeof user.email === "string" ? user.email : null,
          name: profileResult.data?.full_name ?? null,
          gender: profileResult.data?.gender ?? null,
          avatar_url: profileResult.data?.avatar_url ?? null,
        },

        participant: {
          id: participant.id,
          roomStatus: participant.room_status,
          email: participant.email,
          name: participant.full_name,
          phone: participant.phone,
          goal: participant.goal,
          isAdmin: participant.is_admin,
          adminRole: participant.admin_role,
          statusReason: participant.status_reason,
          statusChangedAt: participant.status_changed_at,
          graceSlotsUsed: participant.grace_slots_used,
          eviction_stage: participant.eviction_stage,
        },

        room: {
          id: room.id,
          name: room.name,
          description: room.description,
          status: room.status,
          startDate: room.start_date,
          endDate: room.end_date,
        },

        today: {
          date: todayString,
          timezone,
          submissionCompleted: Boolean(todaySubmissionResult.data),
          partnerReviewSubmitted,
          partnerSubmissionSubmitted,
          reviewerReportSubmitted,
        },

        // Retain this property for existing frontend consumers.
        partner,

        // Explicit partner roles for the updated frontend.
        partnerToReview,
        reviewer,

        submissionActivity: {
          dates:
            submissionActivityResult.data?.map(
              (submission) => submission.submission_date,
            ) ?? [],
        },

        accountability: {
          hasViolation,
          hasPendingFine,
          hasOverdueFine,
          totalFineCount,
        },
      },
      {
        status: 200,
        headers: responseHeaders,
      },
    );
  } catch (error) {
    console.error("Unexpected Result Room dashboard error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  }
}
