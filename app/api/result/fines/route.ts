import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    console.log("Fines request received");

    const supabase = await createClient();

    const admin = createAdminClient();

    // ---------------------------------------------------------
    // 1. Authenticate the user
    // ---------------------------------------------------------
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims) {
      console.error("Authentication error:", claimsError);

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const claims = claimsData.claims;
    const userId = claims.sub;

    console.log("Fines authentication successful", {
      userId,
    });

    // Find the authenticated participant.
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

    console.log("Fines participant resolved", {
      participantId: participant.id,
      roomId: participant.room_id,
      roomStatus: participant.room_status,
    });

    const { data: fines, error: finesError } = await admin
      .from("fines")
      .select(
        `
    id,
    participant_id,
    room_id,
    violation_id,
    source,
    reason,
    amount,
    status,
    due_at,
    paid_at,
    created_at,
    updated_at,
    violation:violations!fines_violation_id_fkey (
      id,
      type,
      occurred_on,
      notes,
      consequence,
      resolved_at,
      resolution_note
    )
  `,
      )
      .eq("participant_id", participant.id)
      .eq("room_id", participant.room_id)
      .order("created_at", { ascending: false });
    console.log({ fines });
    if (finesError) {
      console.error("Fine lookup failed:", finesError);

      return NextResponse.json(
        { error: "Failed to retrieve fines" },
        { status: 500 },
      );
    }

    console.log("Fines retrieved", {
      participantId: participant.id,
      fineCount: fines?.length ?? 0,
    });

    // Retrieve payment attempts belonging to this participant.
    const { data: payments, error: paymentsError } = await supabase
      .from("fine_payments")
      .select(
        `
        id,
        fine_id,
        amount,
        status,
        paystack_reference,
        paid_at,
        created_at,
        updated_at
      `,
      )
      .eq("participant_id", participant.id)
      .order("created_at", { ascending: false });

    if (paymentsError) {
      console.error("Fine-payment lookup failed:", paymentsError);

      return NextResponse.json(
        { error: "Failed to retrieve fine payments" },
        { status: 500 },
      );
    }

    console.log("Fine payments retrieved", {
      participantId: participant.id,
      paymentCount: payments?.length ?? 0,
    });

    const unpaidFines = (fines ?? []).filter(
      (fine) => fine.status === "UNPAID",
    );

    // Fine amounts are stored in naira.
    const outstandingAmount = unpaidFines.reduce(
      (total, fine) => total + fine.amount,
      0,
    );

    console.log("Fines response summary", {
      participantId: participant.id,
      totalFines: fines?.length ?? 0,
      unpaidCount: unpaidFines.length,
      paymentCount: payments?.length ?? 0,
      outstandingAmount,
    });

    return NextResponse.json({
      fines: fines ?? [],
      payments: payments ?? [],
      summary: {
        totalFines: fines?.length ?? 0,
        unpaidCount: unpaidFines.length,
        paidCount: (fines ?? []).filter((fine) => fine.status === "PAID")
          .length,
        waivedCount: (fines ?? []).filter((fine) => fine.status === "WAIVED")
          .length,
        outstandingAmount,
        currency: "NGN",
      },
    });
  } catch (error) {
    console.error("Get fines error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
