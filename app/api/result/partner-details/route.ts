import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Authenticate the current user
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 2. Get the current participant
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
      console.warn("Partner details participant not found", { userId });

      return NextResponse.json(
        { error: "Participant not found." },
        { status: 404 },
      );
    }

    if (participant.room_status !== "active") {
      console.warn("Partner details participant is not active", {
        participantId: participant.id,
        roomStatus: participant.room_status,
      });

      return NextResponse.json(
        { error: "Your participant account is not active." },
        { status: 403 },
      );
    }

    // 3. Find the current participant's active partner pair
    const { data: pair, error: pairError } = await supabase
      .from("partner_pairs")
      .select("participant_a_id, participant_b_id")
      .eq("status", "ACTIVE")
      .or(
        `participant_a_id.eq.${participant.id},participant_b_id.eq.${participant.id}`,
      )
      .maybeSingle();

    if (pairError) {
      console.error("Failed to fetch partner pair:", pairError);

      return NextResponse.json(
        { error: "Failed to fetch partner information." },
        { status: 500 },
      );
    }

    if (!pair) {
      console.warn("Partner details active pair not found", {
        participantId: participant.id,
        roomId: participant.room_id,
      });

      return NextResponse.json(
        { error: "No active partner found." },
        { status: 404 },
      );
    }

    // 4. Determine the partner's participant ID
    const partnerId =
      pair.participant_a_id === participant.id
        ? pair.participant_b_id
        : pair.participant_a_id;

    // 5. Fetch the partner's participant details, including goal
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
      console.warn("Partner details participant record not found", {
        participantId: participant.id,
        partnerId,
        roomId: participant.room_id,
      });

      return NextResponse.json(
        { error: "Partner participant not found." },
        { status: 404 },
      );
    }

    // 6. Fetch the partner's profile for their avatar and name
    let profile: {
      full_name: string | null;
      avatar_url: string | null;
    } | null = null;

    if (partner.user_id) {
      const { data, error: profileError } = await supabase
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

      profile = data;
    }

    // 7. Return the partner's details
    return NextResponse.json({
      partner: {
        id: partner.id,
        full_name: profile?.full_name ?? partner.full_name,
        phone: partner.phone,
        email: partner.email,
        avatar_url: profile?.avatar_url ?? null,
        goal: partner.goal,
        seat_number: partner.seat_number,
      },
    });
  } catch (error) {
    console.error("Partner details API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
