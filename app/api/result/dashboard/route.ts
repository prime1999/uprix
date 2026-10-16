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

/**
 * Validate a browser-supplied IANA timezone.
 */
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

/**
 * Get today's calendar date in the participant's timezone.
 */
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

export async function GET(request: Request) {
  try {
    console.log("[Result Room dashboard] GET request started");

    /**
     * 1. Validate the browser timezone.
     *
     * The frontend sends:
     * x-time-zone: Intl.DateTimeFormat().resolvedOptions().timeZone
     */
    const timezone = request.headers.get("x-time-zone");

    if (!timezone || !isValidTimezone(timezone)) {
      console.warn(
        "[Result Room dashboard] Invalid or missing browser timezone",
        { timezone },
      );

      return NextResponse.json(
        {
          success: false,
          error: "A valid browser timezone is required.",
          code: "INVALID_TIMEZONE",
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    console.log("[Result Room dashboard] Browser timezone validated", {
      timezone,
    });

    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    /**
     * 2. Authenticate the current user.
     */
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims?.sub) {
      console.warn("[Result Room dashboard] Authentication failed", {
        hasClaimsError: Boolean(claimsError),
        hasUserId: Boolean(claimsData?.claims?.sub),
      });

      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    const user = claimsData.claims;
    console.log("[Result Room dashboard] User authenticated");

    /**
     * 3. Fetch the profile and participant.
     *
     * Include timezone so we only update the database
     * when the browser's timezone has changed.
     */
    const [profileResult, participantResult] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("user_id, full_name, gender")
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
          timezone
        `,
        )
        .eq("user_id", user.sub)
        .maybeSingle(),
    ]);

    if (profileResult.error) {
      console.error(
        "Result Room dashboard profile error:",
        profileResult.error,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to load profile",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    if (participantResult.error) {
      console.error(
        "Result Room dashboard participant error:",
        participantResult.error,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to load participant",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    const participant = participantResult.data;

    if (!participant) {
      console.warn("[Result Room dashboard] Participant not found");

      return NextResponse.json(
        {
          success: false,
          error: "Result Room participant not found",
        },
        {
          status: 404,
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    console.log("[Result Room dashboard] Profile and participant loaded", {
      participantId: participant.id,
      roomId: participant.room_id,
      participantTimezone: participant.timezone,
    });

    /**
     * 4. Save the browser timezone.
     *
     * The update is restricted to the authenticated user's
     * participant record.
     *
     * Avoid unnecessary writes when the timezone is unchanged.
     */
    if (participant.timezone !== timezone) {
      console.log("[Result Room dashboard] Updating participant timezone", {
        participantId: participant.id,
        previousTimezone: participant.timezone,
        nextTimezone: timezone,
      });

      const { error: timezoneUpdateError } = await supabase
        .from("participants")
        .update({
          timezone,
        })
        .eq("id", participant.id)
        .eq("user_id", user.sub);

      if (timezoneUpdateError) {
        console.error(
          "Result Room dashboard timezone update error:",
          timezoneUpdateError,
        );

        return NextResponse.json(
          {
            success: false,
            error: "Failed to update participant timezone",
          },
          {
            status: 500,
            headers: {
              "Cache-Control": "private, no-store",
            },
          },
        );
      }

      console.log("[Result Room dashboard] Participant timezone updated", {
        participantId: participant.id,
      });
    }

    /**
     * 5. Fetch the participant's room.
     */
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select(
        `
        id,
        name,
        description,
        status,
        start_date,
        end_date
      `,
      )
      .eq("id", participant.room_id)
      .single();

    if (roomError || !room) {
      console.error("Result Room dashboard room error:", roomError);

      return NextResponse.json(
        {
          success: false,
          error: "Result Room not found",
        },
        {
          status: 404,
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    console.log("[Result Room dashboard] Room loaded", {
      roomId: room.id,
      roomStatus: room.status,
      startDate: room.start_date,
      endDate: room.end_date,
    });

    /**
     * 6. Calculate today's date in the browser's timezone.
     */
    const now = new Date();
    const todayString = getDateInTimezone(now, timezone);
    console.log("[Result Room dashboard] Calculated dashboard date", {
      todayString,
      timezone,
    });

    /**
     * 7. Fetch today's submission, submission activity,
     *    violation history, and outstanding fines.
     */
    const [
      todaySubmissionResult,
      submissionActivityResult,
      violationResult,
      fineResult,
    ] = await Promise.all([
      supabase
        .from("submissions")
        .select("id")
        .eq("participant_id", participant.id)
        .eq("submission_date", todayString)
        .maybeSingle(),

      supabase
        .from("submissions")
        .select("submission_date")
        .eq("participant_id", participant.id)
        .gte("submission_date", room.start_date)
        .lte("submission_date", room.end_date)
        .order("submission_date", {
          ascending: true,
        }),

      supabase
        .from("violations")
        .select("id")
        .eq("participant_id", participant.id)
        .limit(1)
        .maybeSingle(),

      supabase
        .from("fines")
        .select("id, status, due_at")
        .eq("participant_id", participant.id)
        .eq("status", "UNPAID"),
    ]);

    if (todaySubmissionResult.error) {
      console.error(
        "Result Room dashboard today submission error:",
        todaySubmissionResult.error,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to load today's submission",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    if (submissionActivityResult.error) {
      console.error(
        "Result Room dashboard submission activity error:",
        submissionActivityResult.error,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to load submission activity",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    if (violationResult.error) {
      console.error(
        "Result Room dashboard violation error:",
        violationResult.error,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to load violation status",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    if (fineResult.error) {
      console.error("Result Room dashboard fine error:", fineResult.error);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to load fine status",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    const unpaidFines = fineResult.data ?? [];
    const currentTime = now.getTime();

    const hasPendingFine = unpaidFines.some(
      (fine) =>
        fine.due_at !== null && new Date(fine.due_at).getTime() > currentTime,
    );

    const hasOverdueFine = unpaidFines.some(
      (fine) =>
        fine.due_at !== null && new Date(fine.due_at).getTime() <= currentTime,
    );

    console.log("[Result Room dashboard] Dashboard status queries loaded", {
      submissionCompleted: Boolean(todaySubmissionResult.data),
      submissionActivityCount: submissionActivityResult.data?.length ?? 0,
      hasViolation: Boolean(violationResult.data),
      unpaidFineCount: unpaidFines.length,
      hasPendingFine,
      hasOverdueFine,
    });

    /**
     * 8. Fetch today's partner submission and review.
     *
     * Partner reviews are independent of the participant's
     * own submission.
     */
    let partnerReviewSubmitted = false;
    let partnerSubmissionSubmitted = false;

    let partner: {
      id: string;
      submissionSubmitted: boolean;
    } | null = null;

    const { data: activePair, error: activePairError } = await supabase
      .from("partner_pairs")
      .select("id, participant_a_id, participant_b_id")
      .eq("room_id", participant.room_id)
      .eq("status", "ACTIVE")
      .or(
        `participant_a_id.eq.${participant.id},participant_b_id.eq.${participant.id}`,
      )
      .maybeSingle();

    if (activePairError) {
      console.error(
        "Result Room dashboard active partner pair error:",
        activePairError,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to load partner information",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    console.log("[Result Room dashboard] Active partner pair lookup complete", {
      hasActivePair: Boolean(activePair),
      partnerPairId: activePair?.id ?? null,
    });

    if (activePair) {
      const partnerId =
        activePair.participant_a_id === participant.id
          ? activePair.participant_b_id
          : activePair.participant_a_id;

      const [partnerSubmissionResult, partnerReviewResult] = await Promise.all([
        supabase
          .from("submissions")
          .select("id")
          .eq("participant_id", partnerId)
          .eq("room_id", participant.room_id)
          .eq("submission_date", todayString)
          .maybeSingle(),

        supabase
          .from("partner_reviews")
          .select("id")
          .eq("partner_pair_id", activePair.id)
          .eq("reviewer_id", participant.id)
          .eq("partner_id", partnerId)
          .eq("review_date", todayString)
          .maybeSingle(),
      ]);

      if (partnerSubmissionResult.error) {
        console.error(
          "Result Room dashboard partner submission error:",
          partnerSubmissionResult.error,
        );

        return NextResponse.json(
          {
            success: false,
            error: "Failed to load partner submission status",
          },
          {
            status: 500,
            headers: {
              "Cache-Control": "private, no-store",
            },
          },
        );
      }

      if (partnerReviewResult.error) {
        console.error(
          "Result Room dashboard partner review error:",
          partnerReviewResult.error,
        );

        return NextResponse.json(
          {
            success: false,
            error: "Failed to load partner review status",
          },
          {
            status: 500,
            headers: {
              "Cache-Control": "private, no-store",
            },
          },
        );
      }

      partnerSubmissionSubmitted = Boolean(partnerSubmissionResult.data);
      partnerReviewSubmitted = Boolean(partnerReviewResult.data);

      partner = {
        id: partnerId,
        submissionSubmitted: partnerSubmissionSubmitted,
      };

      console.log("[Result Room dashboard] Partner status loaded", {
        partnerSubmissionSubmitted,
        partnerReviewSubmitted,
      });
    }

    /**
     * 9. Return the dashboard data.
     *
     * Progress calculations remain client-side.
     */
    const responseData = {
      success: true as const,

      profile: {
        id: user.sub,
        email: typeof user.email === "string" ? user.email : null,
        name: profileResult.data?.full_name ?? null,
        gender: profileResult.data?.gender ?? null,
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
      },

      partner,

      submissionActivity: {
        dates:
          submissionActivityResult.data?.map(
            (submission) => submission.submission_date,
          ) ?? [],
      },

      accountability: {
        hasViolation: Boolean(violationResult.data),
        hasPendingFine,
        hasOverdueFine,
      },
    };

    console.log("[Result Room dashboard] Returning dashboard response", {
      participantId: participant.id,
      roomId: room.id,
      hasPartner: Boolean(partner),
    });

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
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
