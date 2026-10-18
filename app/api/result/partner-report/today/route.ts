import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function privateResponse(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate the current user.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return privateResponse({ error: "You must be signed in." }, 401);
    }

    // 2. Determine today's date in the requested timezone.
    const requestedTimeZone = request.headers.get("x-time-zone") ?? "UTC";

    let timeZone: string;

    try {
      new Intl.DateTimeFormat("en-US", {
        timeZone: requestedTimeZone,
      });

      timeZone = requestedTimeZone;
    } catch {
      return privateResponse({ error: "Invalid timezone provided." }, 400);
    }

    const dateParts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const dateValues = Object.fromEntries(
      dateParts.map((part) => [part.type, part.value]),
    );

    const today = `${dateValues.year}-${dateValues.month}-${dateValues.day}`;

    // 3. Find the participant associated with this account.
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, room_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error(
        "Today's partner report participant lookup failed:",
        participantError,
      );

      return privateResponse(
        { error: "Unable to load your participant record." },
        500,
      );
    }

    if (!participant) {
      return privateResponse({ error: "Participant record not found." }, 404);
    }

    // 4. Find all partner pairs involving this participant.
    // Include ended pairs so the lookup is not limited to active pairings.
    const { data: partnerPairs, error: partnerPairsError } = await supabase
      .from("partner_pairs")
      .select("id")
      .eq("room_id", participant.room_id)
      .or(
        `participant_a_id.eq.${participant.id},participant_b_id.eq.${participant.id}`,
      );

    if (partnerPairsError) {
      console.error(
        "Today's partner report pair lookup failed:",
        partnerPairsError,
      );

      return privateResponse(
        { error: "Unable to load your partner records." },
        500,
      );
    }

    const partnerPairIds = (partnerPairs ?? []).map((pair) => pair.id);

    if (partnerPairIds.length === 0) {
      return privateResponse({
        date: today,
        report: null,
        message: "No partner report was submitted today.",
      });
    }

    // 5. Retrieve the report submitted by this participant today.
    const { data: report, error: reportError } = await supabase
      .from("partner_reviews")
      .select(
        `
            id,
            reviewer_id,
            partner_id,
            partner_pair_id,
            review_date,
            submitted_on_time,
            comment,
            reviewed_at,
            created_at
          `,
      )
      .eq("reviewer_id", participant.id)
      .eq("review_date", today)
      .in("partner_pair_id", partnerPairIds)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reportError) {
      console.error("Today's partner report query failed:", reportError);

      return privateResponse(
        { error: "Unable to retrieve today's partner report." },
        500,
      );
    }

    return privateResponse({
      date: today,
      report,
      message: report
        ? "Today's partner report retrieved successfully."
        : "No partner report was submitted today.",
    });
  } catch (error) {
    console.error("Unexpected today's partner report error:", error);

    return privateResponse({ error: "An unexpected error occurred." }, 500);
  }
}
