import crypto from "crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    // --------------------------------------------------
    // 1. Read the raw request body
    // --------------------------------------------------
    const body = await req.text();

    // --------------------------------------------------
    // 2. Verify Paystack webhook signature
    // --------------------------------------------------
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Paystack signature" },
        { status: 401 },
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error("PAYSTACK_SECRET_KEY is not configured");

      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.error("Invalid Paystack webhook signature");

      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // --------------------------------------------------
    // 3. Parse the webhook payload
    // --------------------------------------------------
    const event = JSON.parse(body);

    console.log("PAYSTACK WEBHOOK VERIFIED");
    console.log({
      event: event.event,
      reference: event.data?.reference,
      amount: event.data?.amount,
    });

    // --------------------------------------------------
    // 4. Only process successful charge events
    // --------------------------------------------------
    if (event.event !== "charge.success") {
      return NextResponse.json({
        received: true,
        processed: false,
      });
    }

    const transaction = event.data;

    const { reference, amount, status, metadata, customer, paid_at } =
      transaction;

    // --------------------------------------------------
    // 5. Make sure the transaction itself was successful
    // --------------------------------------------------
    if (status !== "success") {
      return NextResponse.json({
        received: true,
        processed: false,
      });
    }

    // --------------------------------------------------
    // 6. Validate required payment metadata
    // --------------------------------------------------
    if (!metadata?.userId || !metadata?.roomId) {
      console.error("Missing required payment metadata");

      return NextResponse.json(
        { error: "Invalid payment metadata" },
        { status: 400 },
      );
    }

    const userId = metadata.userId;
    const roomId = metadata.roomId;

    // --------------------------------------------------
    // 7. Create admin Supabase client
    // --------------------------------------------------
    // Paystack does not have a Supabase user session,
    // so the webhook must use the service-role client.
    // --------------------------------------------------
    const supabase = createAdminClient();

    // --------------------------------------------------
    // 8. Prevent duplicate webhook processing
    // --------------------------------------------------
    const { data: existingPayment, error: existingPaymentError } =
      await supabase
        .from("payments")
        .select("id, status")
        .eq("reference", reference)
        .maybeSingle();

    if (existingPaymentError) {
      console.error("Existing payment lookup error:", existingPaymentError);

      return NextResponse.json(
        { error: "Failed to check payment" },
        { status: 500 },
      );
    }

    // Paystack can retry the same webhook.
    // The payment reference is unique, so never process it twice.
    if (existingPayment) {
      console.log("Payment already processed:", reference);

      return NextResponse.json({
        received: true,
        alreadyProcessed: true,
      });
    }

    // --------------------------------------------------
    // 9. Get room payment settings
    // --------------------------------------------------
    const { data: roomSettings, error: settingsError } = await supabase
      .from("room_settings")
      .select("entry_fee, minimum_deposit, capacity")
      .eq("room_id", roomId)
      .single();

    if (settingsError || !roomSettings) {
      console.error("Room settings error:", settingsError);

      return NextResponse.json(
        { error: "Room settings not found" },
        { status: 500 },
      );
    }

    // --------------------------------------------------
    // 10. Validate the payment amount
    // --------------------------------------------------
    if (
      !Number.isInteger(amount) ||
      amount <= 0 ||
      amount > roomSettings.entry_fee
    ) {
      console.error("Invalid payment amount:", amount);

      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 11. Find the participant for this room and user
    // --------------------------------------------------
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select(
        `
            id,
            room_id,
            user_id,
            total_paid,
            balance,
            status,
            seat_number
          `,
      )
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error("Participant lookup error:", participantError);

      return NextResponse.json(
        { error: "Failed to check participant" },
        { status: 500 },
      );
    }

    let participantId: string;

    // --------------------------------------------------
    // 12. Create participant after successful payment
    // --------------------------------------------------
    if (!participant) {
      // This is the user's first successful payment.

      // Get the user's name from their Uprix profile.
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("full_name")
        .eq("user_id", userId)
        .single();

      if (profileError || !profile) {
        console.error("Profile lookup error:", profileError);

        return NextResponse.json(
          { error: "User profile not found" },
          { status: 500 },
        );
      }

      if (!customer?.email) {
        console.error("Paystack customer email is missing");

        return NextResponse.json(
          { error: "Customer email missing" },
          { status: 400 },
        );
      }

      // Phone number and goal should come from the
      // initial payment metadata.
      if (!metadata.phoneNumber || !metadata.goal) {
        console.error("Missing phone number or goal in payment metadata");

        return NextResponse.json(
          {
            error: "Required participant information is missing",
          },
          { status: 400 },
        );
      }

      const { data: newParticipant, error: createParticipantError } =
        await supabase
          .from("participants")
          .insert({
            room_id: roomId,
            user_id: userId,
            full_name: profile.full_name,
            email: customer.email,
            phone: metadata.phoneNumber,
            goal: metadata.goal,
            total_paid: 0,
            balance: roomSettings.entry_fee,
            status: "PENDING",
          })
          .select("id")
          .single();

      if (createParticipantError || !newParticipant) {
        console.error("Create participant error:", createParticipantError);

        return NextResponse.json(
          { error: "Failed to create participant" },
          { status: 500 },
        );
      }

      participantId = newParticipant.id;
    } else {
      // This is a continuation payment.

      participantId = participant.id;

      // --------------------------------------------------
      // 12A. Make sure the participant still has a balance
      // --------------------------------------------------
      if (participant.balance <= 0) {
        console.error(
          "Payment received for an already fully-paid participant:",
          participant.id,
        );

        return NextResponse.json(
          {
            error: "Participant payment is already complete",
          },
          { status: 400 },
        );
      }

      // --------------------------------------------------
      // 12B. Never allow payment above the balance
      // --------------------------------------------------
      if (amount > participant.balance) {
        console.error("Payment exceeds participant balance:", {
          amount,
          balance: participant.balance,
          participantId: participant.id,
        });

        return NextResponse.json(
          {
            error: "Payment exceeds the participant's remaining balance",
          },
          { status: 400 },
        );
      }

      // --------------------------------------------------
      // 12C. Validate installment amount
      //
      // Allowed:
      // - ₦1,000 increments
      // - Exact remaining balance
      // --------------------------------------------------
      const isExactBalance = amount === participant.balance;

      const isThousandIncrement = amount % 100000 === 0;

      if (!isExactBalance && !isThousandIncrement) {
        console.error("Invalid continuation payment amount:", {
          amount,
          balance: participant.balance,
        });

        return NextResponse.json(
          {
            error:
              "Installment payments must be in ₦1,000 increments or the exact remaining balance",
          },
          { status: 400 },
        );
      }
    }

    // --------------------------------------------------
    // 13. Record the successful payment
    // --------------------------------------------------
    const { error: paymentError } = await supabase.from("payments").insert({
      participant_id: participantId,
      amount,
      reference,
      provider: "paystack",
      status: "SUCCESS",
      paid_at: paid_at ?? new Date().toISOString(),
    });

    if (paymentError) {
      console.error("Payment insert error:", paymentError);

      // The reference is unique.
      // If Paystack somehow sends the same transaction
      // again, treat it as already processed.
      if (paymentError.code === "23505") {
        return NextResponse.json({
          received: true,
          alreadyProcessed: true,
        });
      }

      return NextResponse.json(
        { error: "Failed to record payment" },
        { status: 500 },
      );
    }

    // --------------------------------------------------
    // 14. Calculate total paid for THIS participant
    // --------------------------------------------------
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("amount")
      .eq("participant_id", participantId)
      .eq("status", "SUCCESS");

    if (paymentsError) {
      console.error("Payment total error:", paymentsError);

      return NextResponse.json(
        { error: "Failed to calculate payment total" },
        { status: 500 },
      );
    }

    const totalPaid =
      payments?.reduce((total, payment) => total + payment.amount, 0) ?? 0;

    // Never allow balance below zero.
    const balance = Math.max(roomSettings.entry_fee - totalPaid, 0);

    const isFullyPaid = balance === 0;

    console.log({
      participantId,
      totalPaid,
      balance,
      isFullyPaid,
    });

    // --------------------------------------------------
    // 15. Update participant payment status
    // --------------------------------------------------
    const { error: updateParticipantError } = await supabase
      .from("participants")
      .update({
        total_paid: totalPaid,
        balance,
        status: isFullyPaid ? "FULLY_PAID" : "PARTIALLY_PAID",
        updated_at: new Date().toISOString(),
      })
      .eq("id", participantId);

    if (updateParticipantError) {
      console.error("Participant update error:", updateParticipantError);

      return NextResponse.json(
        { error: "Failed to update participant" },
        { status: 500 },
      );
    }

    // --------------------------------------------------
    // 16. Assign a seat only after full payment
    // --------------------------------------------------
    let seatNumber: number | null = null;

    if (isFullyPaid) {
      const { data: assignedSeat, error: seatError } = await supabase.rpc(
        "assign_participant_seat",
        {
          p_participant_id: participantId,
          p_room_id: roomId,
          p_capacity: roomSettings.capacity,
        },
      );

      console.log({
        assignedSeat,
        seatError,
      });

      if (seatError) {
        console.error("Seat assignment error:", seatError);

        // The RPC returns ROOM_FULL when all seats
        // have already been taken.
        if (seatError.message?.includes("ROOM_FULL")) {
          return NextResponse.json(
            {
              error: "Payment successful, but the room is full",
            },
            { status: 409 },
          );
        }

        return NextResponse.json(
          { error: "Failed to assign seat" },
          { status: 500 },
        );
      }

      seatNumber = assignedSeat;
    }

    // --------------------------------------------------
    // 17. Final logging
    // --------------------------------------------------
    console.log("PAYMENT PROCESSED SUCCESSFULLY");

    console.log({
      reference,
      participantId,
      userId,
      roomId,
      amount,
      totalPaid,
      balance,
      status: isFullyPaid ? "FULLY_PAID" : "PARTIALLY_PAID",
      seatNumber,
    });

    // --------------------------------------------------
    // 18. Respond to Paystack
    // --------------------------------------------------
    return NextResponse.json({
      received: true,
      processed: true,
      participantId,
      totalPaid,
      balance,
      status: isFullyPaid ? "FULLY_PAID" : "PARTIALLY_PAID",
      seatNumber,
    });
  } catch (error) {
    console.error("Webhook error:", error);

    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
