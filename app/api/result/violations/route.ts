import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    // 1. Authenticate the user.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = claimsData.claims.sub;

    // 2. Find the authenticated participant.
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, room_id, room_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error("Participant lookup failed:", participantError);

      return NextResponse.json(
        { error: "Failed to retrieve participant" },
        { status: 500 },
      );
    }

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 },
      );
    }

    // 3. Parse and validate pagination parameters.
    const searchParams = new URL(request.url).searchParams;

    const requestedPage = Number(searchParams.get("page") ?? 1);
    const requestedPageSize = Number(
      searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE,
    );

    if (
      !Number.isSafeInteger(requestedPage) ||
      requestedPage < 1 ||
      !Number.isSafeInteger(requestedPageSize) ||
      requestedPageSize < 1
    ) {
      return NextResponse.json(
        {
          error:
            "page must be a positive integer and pageSize must be a positive integer",
        },
        { status: 400 },
      );
    }

    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);

    // 4. Fetch only this participant's violations for this room.
    const from = (requestedPage - 1) * pageSize;
    const to = from + pageSize - 1;

    const {
      data: violations,
      error: violationsError,
      count,
    } = await admin
      .from("violations")
      .select(
        `
          id,
          participant_id,
          room_id,
          type,
          notes,
          occurred_on,
          created_at,
          resolved_at,
          resolution_note,
          consequence
        `,
        { count: "exact" },
      )
      .eq("participant_id", participant.id)
      .eq("room_id", participant.room_id)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (violationsError) {
      console.error("Violation lookup failed:", violationsError);

      return NextResponse.json(
        { error: "Failed to retrieve violations" },
        { status: 500 },
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      violations: violations ?? [],
      pagination: {
        page: requestedPage,
        pageSize,
        total,
        totalPages,
        hasNextPage: requestedPage < totalPages,
        hasPreviousPage: requestedPage > 1 && total > 0,
      },
    });
  } catch (error) {
    console.error("Get violations error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
