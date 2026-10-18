import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Authenticate the current user.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 2. Get the current participant.
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, room_id, room_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error("Failed to fetch participant:", participantError);

      return NextResponse.json(
        { error: "Failed to fetch participant details." },
        { status: 500 },
      );
    }

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found." },
        { status: 404 },
      );
    }

    if (participant.room_status !== "active") {
      return NextResponse.json(
        { error: "Your participant account is not active." },
        { status: 403 },
      );
    }

    // 3. Fetch all active assignments for the current participant.
    const { data: activePairs, error: pairError } = await supabase
      .from("partner_pairs")
      .select("id, participant_a_id, participant_b_id, reviewer_id")
      .eq("room_id", participant.room_id)
      .eq("status", "ACTIVE")
      .or(
        `participant_a_id.eq.${participant.id},participant_b_id.eq.${participant.id}`,
      );

    if (pairError) {
      console.error("Failed to fetch partner pairs:", pairError);

      return NextResponse.json(
        { error: "Failed to fetch partner information." },
        { status: 500 },
      );
    }

    // 4. Find the assignment that authorizes the current participant
    // to review the other participant.
    //
    // Mutual pair: reviewer_id is NULL.
    // Directional pair: reviewer_id must equal the current participant.
    const eligiblePairs = (activePairs ?? []).filter(
      (pair) =>
        pair.reviewer_id === null || pair.reviewer_id === participant.id,
    );

    if (eligiblePairs.length === 0) {
      return NextResponse.json(
        { error: "No active partner assignment found." },
        { status: 404 },
      );
    }

    if (eligiblePairs.length > 1) {
      console.error("Ambiguous partner assignment:", {
        participantId: participant.id,
        pairIds: eligiblePairs.map((pair) => pair.id),
      });

      return NextResponse.json(
        {
          error:
            "Multiple partner assignments found. Please contact an administrator.",
          code: "AMBIGUOUS_PARTNER_ASSIGNMENT",
        },
        { status: 409 },
      );
    }

    const pair = eligiblePairs[0];

    // 5. Resolve the assigned partner's participant ID.
    const partnerId =
      pair.participant_a_id === participant.id
        ? pair.participant_b_id
        : pair.participant_a_id;

    // 6. Fetch the assigned partner's participant details.
    const { data: partner, error: partnerError } = await supabase
      .from("participants")
      .select("id, user_id, full_name, phone, email, seat_number, goal")
      .eq("id", partnerId)
      .eq("room_id", participant.room_id)
      .maybeSingle();

    if (partnerError) {
      console.error("Failed to fetch partner participant:", partnerError);

      return NextResponse.json(
        { error: "Failed to fetch partner details." },
        { status: 500 },
      );
    }

    if (!partner) {
      return NextResponse.json(
        { error: "Partner participant not found." },
        { status: 404 },
      );
    }

    // 7. Fetch the assigned partner's profile.
    let profile: {
      full_name: string | null;
      avatar_url: string | null;
    } | null = null;

    if (partner.user_id) {
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("full_name, avatar_url")
        .eq("user_id", partner.user_id)
        .maybeSingle();

      if (profileError) {
        console.error("Failed to fetch partner profile:", profileError);

        return NextResponse.json(
          { error: "Failed to fetch partner profile." },
          { status: 500 },
        );
      }

      profile = profileData;
    }

    // 8. Return the partner details.
    return NextResponse.json(
      {
        partner: {
          id: partner.id,
          full_name: profile?.full_name ?? partner.full_name,
          phone: partner.phone,
          email: partner.email,
          avatar_url: profile?.avatar_url ?? null,
          goal: partner.goal,
          seat_number: partner.seat_number,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Partner details API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  }
}
