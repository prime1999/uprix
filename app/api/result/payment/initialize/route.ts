import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

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
    const userEmail = claims.email;

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "Unable to identify authenticated user" },
        { status: 401 },
      );
    }

    // ---------------------------------------------------------
    // 2. Read and validate the request body
    // ---------------------------------------------------------
    const body = await req.json();

    const { amount, phoneNumber, goal } = body;

    if (!Number.isInteger(amount)) {
      return NextResponse.json(
        { error: "A valid payment amount is required" },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // 3. Get the next upcoming Result Room
    // ---------------------------------------------------------
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, name, status")
      .eq("status", "UPCOMING")
      .order("start_date", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle();

    if (roomError) {
      console.error("Failed to fetch upcoming room:", roomError);

      return NextResponse.json(
        { error: "Failed to find the upcoming Result Room" },
        { status: 500 },
      );
    }

    if (!room) {
      return NextResponse.json(
        { error: "There is currently no upcoming Result Room" },
        { status: 404 },
      );
    }

    // ---------------------------------------------------------
    // 4. Get payment settings for the room
    // ---------------------------------------------------------
    const { data: settings, error: settingsError } = await supabase
      .from("room_settings")
      .select(
        `
        room_id,
        entry_fee,
        minimum_deposit,
        capacity,
        payment_open_at,
        payment_close_at
      `,
      )
      .eq("room_id", room.id)
      .single();

    if (settingsError || !settings) {
      console.error("Failed to fetch room settings:", settingsError);

      return NextResponse.json(
        { error: "Failed to load Result Room payment settings" },
        { status: 500 },
      );
    }

    // ---------------------------------------------------------
    // 5. Find out whether the user is already a participant
    // ---------------------------------------------------------
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select(
        `
          id,
          room_id,
          total_paid,
          balance,
          status,
          seat_number
        `,
      )
      .eq("room_id", room.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error("Failed to find participant:", participantError);

      return NextResponse.json(
        { error: "Unable to verify your Result Room status" },
        { status: 500 },
      );
    }

    // ---------------------------------------------------------
    // 6. Validate payment based on participant status
    //
    //    NEW PARTICIPANT:
    //    - Minimum payment is the room's minimum deposit
    //    - Payment cannot exceed the entry fee
    //
    //    EXISTING PARTICIPANT:
    //    - Payment cannot exceed their remaining balance
    //    - Installments must be ₦1,000 increments
    //    - The exact remaining balance is also allowed
    // ---------------------------------------------------------

    if (!participant) {
      // -------------------------------------------------------
      // Initial payment
      // -------------------------------------------------------

      if (
        !phoneNumber ||
        typeof phoneNumber !== "string" ||
        !phoneNumber.trim()
      ) {
        return NextResponse.json(
          { error: "Phone number is required" },
          { status: 400 },
        );
      }

      if (!goal || typeof goal !== "string" || !goal.trim()) {
        return NextResponse.json(
          { error: "Your goal is required" },
          { status: 400 },
        );
      }

      if (amount < settings.minimum_deposit) {
        return NextResponse.json(
          {
            error: `Minimum deposit is ₦${(
              settings.minimum_deposit / 100
            ).toLocaleString()}`,
          },
          { status: 400 },
        );
      }

      if (amount > settings.entry_fee) {
        return NextResponse.json(
          {
            error: `Payment cannot exceed the entry fee of ₦${(
              settings.entry_fee / 100
            ).toLocaleString()}`,
          },
          { status: 400 },
        );
      }
    } else {
      // -------------------------------------------------------
      // Follow-up payment
      // -------------------------------------------------------

      if (participant.balance <= 0) {
        return NextResponse.json(
          { error: "Your Result Room payment is already complete" },
          { status: 400 },
        );
      }

      // Payment cannot be greater than the remaining balance.
      if (amount > participant.balance) {
        return NextResponse.json(
          {
            error: `Payment cannot exceed your remaining balance of ₦${(
              participant.balance / 100
            ).toLocaleString()}`,
          },
          { status: 400 },
        );
      }

      // Allow either:
      // 1. A ₦1,000 increment
      // 2. The exact remaining balance
      //
      // 100,000 kobo = ₦1,000
      const isExactBalance = amount === participant.balance;
      const isThousandIncrement = amount % 100000 === 0;

      if (!isExactBalance && !isThousandIncrement) {
        return NextResponse.json(
          {
            error:
              "Installment payments must be in ₦1,000 increments or the exact remaining balance",
          },
          { status: 400 },
        );
      }
    }

    // ---------------------------------------------------------
    // 7. Check payment window
    // ---------------------------------------------------------
    // TODO: Enable this when payment dates should be enforced.
    //
    // const now = new Date();
    // const paymentOpenAt = new Date(settings.payment_open_at);
    // const paymentCloseAt = new Date(settings.payment_close_at);
    //
    // if (now < paymentOpenAt) {
    //   return NextResponse.json(
    //     { error: "Payment for the Result Room has not opened yet" },
    //     { status: 400 },
    //   );
    // }
    //
    // if (now > paymentCloseAt) {
    //   return NextResponse.json(
    //     { error: "Payment for the Result Room is closed" },
    //     { status: 400 },
    //   );
    // }

    // ---------------------------------------------------------
    // 8. Initialize the Paystack transaction
    // ---------------------------------------------------------
    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          amount,
          currency: "NGN",

          callback_url: `${process.env.APP_URL}/result-room/payment/callback`,

          metadata: {
            userId,
            roomId: room.id,

            // These are useful for the initial payment.
            // For follow-up payments they are already stored
            // on the participant and can simply be ignored.
            ...(phoneNumber &&
              typeof phoneNumber === "string" && {
                phoneNumber: phoneNumber.trim(),
              }),

            ...(goal &&
              typeof goal === "string" && {
                goal: goal.trim(),
              }),
          },
        }),
      },
    );

    const paystackData = await paystackResponse.json();

    // ---------------------------------------------------------
    // 9. Handle Paystack initialization failure
    // ---------------------------------------------------------
    if (!paystackResponse.ok || !paystackData.status) {
      console.error("Paystack initialization failed:", paystackData);

      return NextResponse.json(
        {
          error: paystackData.message || "Unable to initialize payment",
        },
        { status: 500 },
      );
    }

    // ---------------------------------------------------------
    // 10. Return the Paystack checkout URL
    // ---------------------------------------------------------
    return NextResponse.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  } catch (error) {
    console.error("Initialize payment error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while initializing payment",
      },
      { status: 500 },
    );
  }
}
