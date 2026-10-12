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
            // Ignore cookie mutation errors in contexts where cookies
            // cannot be modified.
          }
        },
      },
    },
  );
}

export async function GET() {
  try {
    const cookieStore = await cookies();

    const supabase = createSupabaseServerClient(cookieStore);

    /**
     * ------------------------------------------------------------
     * 1. Authenticate the current user
     * ------------------------------------------------------------
     */
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims) {
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

    /**
     * ------------------------------------------------------------
     * 2. Fetch profile + participant
     * ------------------------------------------------------------
     *
     * These two queries are independent, so we run them together.
     */
    const [profileResult, participantResult] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("user_id, full_name")
        .eq("user_id", user.sub)
        .maybeSingle(),

      supabase
        .from("participants")
        .select(
          `
            id,
            room_id,
            room_status,
            email,
            phone,
            goal,
            is_admin,
            admin_role,
            status_reason,
            status_changed_at
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

    /**
     * A user without a participant record is not inside a room.
     */
    if (!participant) {
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

    /**
     * ------------------------------------------------------------
     * 3. Fetch the participant's actual room
     * ------------------------------------------------------------
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

    /**
     * ------------------------------------------------------------
     * 4. Fetch today's submission
     * ------------------------------------------------------------
     *
     * IMPORTANT:
     * The API no longer calculates today's date.
     *
     * We intentionally keep this endpoint focused on server data.
     *
     * If your submission_date query needs to become participant-local
     * as well, we should handle that consistently in the submission
     * endpoint/database design rather than mixing timeline logic here.
     *
     * For now, this query remains based on the submission data model.
     */
    const today = new Date();

    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const [
      todaySubmissionResult,
      submissionActivityResult,
      violationResult,
      fineResult,
    ] = await Promise.all([
      /**
       * Today's submission.
       */
      supabase
        .from("submissions")
        .select("id")
        .eq("participant_id", participant.id)
        .eq("submission_date", todayString)
        .maybeSingle(),

      /**
       * Only dates are needed for the dashboard heatmap.
       */
      supabase
        .from("submissions")
        .select("submission_date")
        .eq("participant_id", participant.id)
        .gte("submission_date", room.start_date)
        .lte("submission_date", room.end_date)
        .order("submission_date", {
          ascending: true,
        }),

      /**
       * Whether this participant has a violation.
       */
      supabase
        .from("violations")
        .select("id")
        .eq("participant_id", participant.id)
        .limit(1)
        .maybeSingle(),

      /**
       * Whether there is an active fine.
       */
      supabase
        .from("fines")
        .select("status")
        .eq("participant_id", participant.id)
        .in("status", ["pending", "overdue"])
        .limit(1)
        .maybeSingle(),
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
    /**
     * ------------------------------------------------------------
     * 5. Check today's partner submission and review
     * ------------------------------------------------------------
     *
     * A partner review now belongs to an active partner pair and a
     * review date, not to the participant's own submission.
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

    if (activePair) {
      // Resolve the other participant in the active pair.
      const partnerId =
        activePair.participant_a_id === participant.id
          ? activePair.participant_b_id
          : activePair.participant_a_id;

      const [partnerSubmissionResult, partnerReviewResult] = await Promise.all([
        // Has the partner submitted for today's date?
        supabase
          .from("submissions")
          .select("id")
          .eq("participant_id", partnerId)
          .eq("room_id", participant.room_id)
          .eq("submission_date", todayString)
          .maybeSingle(),

        // Has the current participant submitted today's partner review?
        // Has the current participant reviewed this specific partner today?
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
    }
    /**
     * ------------------------------------------------------------
     * 6. Build raw API response
     * ------------------------------------------------------------
     *
     * Notice that we DO NOT calculate:
     *
     * - totalDays
     * - currentDay
     * - progressPercentage
     * - hasStarted
     * - hasEnded
     *
     * Those belong to the client-side calculation utility.
     */
    const responseData = {
      success: true as const,

      profile: {
        id: user.sub,
        email: typeof user.email === "string" ? user.email : null,
        name: profileResult.data?.full_name ?? null,
      },

      participant: {
        id: participant.id,
        roomStatus: participant.room_status,
        email: participant.email,
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
        hasPendingFine: fineResult.data?.status === "pending",
        hasOverdueFine: fineResult.data?.status === "overdue",
      },
    };

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
