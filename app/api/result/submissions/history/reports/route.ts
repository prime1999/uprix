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
        "Partner report history participant lookup failed:",
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

    // 4. Find the participant's partner pairs in this room.
    // A participant can appear as either participant_a_id or
    // participant_b_id in partner_pairs.
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

      return NextResponse.json(
        { error: "Unable to load your partner records." },
        { status: 500 },
      );
    }

    const partnerPairIds = (partnerPairs ?? []).map((pair) => pair.id);

    // No partner pairs means there cannot be reports for this participant
    // in this room.
    if (partnerPairIds.length === 0) {
      return NextResponse.json({
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

    // 5. Fetch reports submitted by the authenticated participant.
    // reviewer_id identifies who submitted the report.
    // partner_id identifies the participant being reported on.
    const {
      data: reports,
      error: reportsError,
      count,
    } = await supabase
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
      .eq("reviewer_id", participant.id)
      .in("partner_pair_id", partnerPairIds)
      .order("review_date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    if (reportsError) {
      console.error("Partner report history query failed:", reportsError);

      return NextResponse.json(
        { error: "Unable to load your partner report history." },
        { status: 500 },
      );
    }

    const reportRows = reports ?? [];
    const total = count ?? 0;

    // 6. Return reports and pagination metadata.
    return NextResponse.json({
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

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
