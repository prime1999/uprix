import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

type Direction = "made" | "received";

function privateResponse(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/** Calendar date (YYYY-MM-DD) in the supplied timezone. */
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

    // 2. Validate query parameters.
    const searchParams = request.nextUrl.searchParams;

    const rawPage = searchParams.get("page");
    const rawLimit = searchParams.get("limit");
    const rawDirection = searchParams.get("direction") ?? "made";

    if (rawDirection !== "made" && rawDirection !== "received") {
      return privateResponse(
        { error: 'direction must be "made" or "received".' },
        400,
      );
    }

    const direction: Direction = rawDirection;

    const page = rawPage === null ? 1 : Number(rawPage);
    const requestedLimit = rawLimit === null ? DEFAULT_LIMIT : Number(rawLimit);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(requestedLimit) ||
      requestedLimit < 1
    ) {
      return privateResponse(
        { error: "Page and limit must be positive integers." },
        400,
      );
    }

    const limit = Math.min(requestedLimit, MAX_LIMIT);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to)) {
      return privateResponse(
        { error: "The requested page is too large." },
        400,
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
        "Partner report history participant lookup failed:",
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

    // 4. Find this participant's partner pairs in their room.
    // Keep inactive pairs so historical reports remain accessible.
    const { data: partnerPairs, error: partnerPairsError } = await supabase
      .from("partner_pairs")
      .select("id")
      .eq("room_id", participant.room_id)
      .or(
        `participant_a_id.eq.${participant.id},participant_b_id.eq.${participant.id}`,
      );

    if (partnerPairsError) {
      console.error(
        "Partner report history pair lookup failed:",
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
        reports: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      });
    }

    // 5. For received reports, hide today's report until the
    // participant has submitted their own report today.
    let hideFromDate: string | null = null;

    if (direction === "received") {
      const timezone = request.headers.get("x-time-zone");

      if (!timezone || !isValidTimezone(timezone)) {
        return privateResponse(
          { error: "A valid browser timezone is required." },
          400,
        );
      }

      const today = getDateInTimezone(new Date(), timezone);

      const { data: myReportToday, error: myReportError } = await supabase
        .from("partner_reviews")
        .select("id")
        .eq("reviewer_id", participant.id)
        .in("partner_pair_id", partnerPairIds)
        .eq("review_date", today)
        .limit(1)
        .maybeSingle();

      if (myReportError) {
        console.error(
          "Partner report history today check failed:",
          myReportError,
        );

        return privateResponse(
          { error: "Unable to load your partner report history." },
          500,
        );
      }

      if (!myReportToday) {
        hideFromDate = today;
      }
    }

    // 6. Fetch reports.
    // made:     reports this participant wrote about their partners.
    // received: reports their partners wrote about this participant.
    let query = supabase
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
        { count: "exact" },
      )
      .eq(direction === "made" ? "reviewer_id" : "partner_id", participant.id)
      .in("partner_pair_id", partnerPairIds);

    if (hideFromDate) {
      query = query.lt("review_date", hideFromDate);
    }

    const {
      data: reports,
      error: reportsError,
      count,
    } = await query
      .order("review_date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    if (reportsError) {
      console.error("Partner report history query failed:", reportsError);

      return privateResponse(
        { error: "Unable to load your partner report history." },
        500,
      );
    }

    const reportRows = reports ?? [];
    const total = count ?? 0;

    console.log({
      reports: reportRows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: from + reportRows.length < total,
      },
    });

    // 7. Return reports and pagination metadata.
    return privateResponse({
      reports: reportRows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: from + reportRows.length < total,
      },
    });
  } catch (error) {
    console.error("Unexpected partner report history error:", error);

    return privateResponse({ error: "An unexpected error occurred." }, 500);
  }
}
