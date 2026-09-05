import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user from claims
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    console.log("Claims data:", claimsData);

    if (claimsError || !claimsData?.claims) {
      console.error("Authentication error:", claimsError);

      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const claims = claimsData.claims;

    const userId = claims.sub;
    const userEmail = claims.email;

    if (!userId || !userEmail) {
      return NextResponse.json(
        {
          error: "Unable to identify authenticated user",
        },
        { status: 401 },
      );
    }

    // Get request body
    const body = await req.json();

    const { amount, phoneNumber, goal } = body;

    // Validate amount
    if (!Number.isInteger(amount)) {
      return NextResponse.json(
        {
          error: "A valid payment amount is required",
        },
        { status: 400 },
      );
    }

    // Validate phone number
    if (
      !phoneNumber ||
      typeof phoneNumber !== "string" ||
      !phoneNumber.trim()
    ) {
      return NextResponse.json(
        {
          error: "Phone number is required",
        },
        { status: 400 },
      );
    }

    // Validate goal
    if (!goal || typeof goal !== "string" || !goal.trim()) {
      return NextResponse.json(
        {
          error: "Your goal is required",
        },
        { status: 400 },
      );
    }

    // Get the next upcoming room
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, name, status")
      .eq("status", "UPCOMING")
      .order("start_date", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle();
    console.log({ room, roomError });

    if (roomError) {
      console.error("Failed to fetch upcoming room:", roomError);

      return NextResponse.json(
        {
          error: "Failed to find the upcoming Result Room",
        },
        { status: 500 },
      );
    }

    if (!room) {
      return NextResponse.json(
        {
          error: "There is currently no upcoming Result Room",
        },
        { status: 404 },
      );
    }

    // Get settings for the upcoming room
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
        {
          error: "Failed to load Result Room payment settings",
        },
        { status: 500 },
      );
    }
    //TODO: addthis back in when payment window is set up
    // Check payment window
    // const now = new Date();

    // const paymentOpenAt = new Date(settings.payment_open_at);

    // const paymentCloseAt = new Date(settings.payment_close_at);

    // if (now < paymentOpenAt) {
    //   return NextResponse.json(
    //     {
    //       error: "Payment for the Result Room has not opened yet",
    //     },
    //     { status: 400 },
    //   );
    // }

    // if (now > paymentCloseAt) {
    //   return NextResponse.json(
    //     {
    //       error: "Payment for the Result Room is closed",
    //     },
    //     { status: 400 },
    //   );
    // }

    // Validate minimum deposit
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

    // Validate maximum payment
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
    // Initialize Paystack transaction
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
            phoneNumber: phoneNumber.trim(),
            goal: goal.trim(),
          },
        }),
      },
    );

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.error("Paystack initialization failed:", paystackData);

      return NextResponse.json(
        {
          error: paystackData.message || "Unable to initialize payment",
        },
        { status: 500 },
      );
    }

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
