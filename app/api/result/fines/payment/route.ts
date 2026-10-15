import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type InitializeFinePaymentBody =
  | {
      fineId: string;
      payAll?: never;
    }
  | {
      payAll: true;
      fineId?: never;
    };

type UnpaidFine = {
  id: string;
  participant_id: string;
  room_id: string;
  amount: number;
  status: "UNPAID" | "PAID" | "WAIVED";
};

function isValidUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    // ---------------------------------------------------------
    // 1. Authenticate the user
    // ---------------------------------------------------------
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const claims = claimsData && claimsData.claims;
    const userId = claims && claims.sub;

    if (claimsError || !claimsData?.claims) {
      return NextResponse.json(
        { error: "You must be signed in to pay a fine." },
        { status: 401 },
      );
    }

    // 2. Validate the requested payment.
    let body: InitializeFinePaymentBody;

    try {
      body = (await request.json()) as InitializeFinePaymentBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const hasFineId = isValidUuid((body as { fineId?: unknown }).fineId);
    const payAll = (body as { payAll?: unknown }).payAll === true;

    if (
      (hasFineId && payAll) ||
      (!hasFineId && !payAll) ||
      (!hasFineId && (body as { fineId?: unknown }).fineId !== undefined) ||
      ((body as { payAll?: unknown }).payAll !== undefined && !payAll)
    ) {
      return NextResponse.json(
        { error: "Provide either a valid fineId or payAll: true." },
        { status: 400 },
      );
    }

    // 3. Find the participant linked to this authenticated account.
    const admin = createAdminClient();

    const { data: participant, error: participantError } = await admin
      .from("participants")
      .select("id, room_id, room_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error(
        "Fine payment participant lookup failed:",
        participantError,
      );

      return NextResponse.json(
        { error: "Unable to verify your participant account." },
        { status: 500 },
      );
    }

    if (!participant) {
      return NextResponse.json(
        { error: "Your Result Room participant record was not found." },
        { status: 404 },
      );
    }

    // 4. Load only unpaid fines belonging to this participant and room.
    let finesQuery = admin
      .from("fines")
      .select("id, participant_id, room_id, amount, status")
      .eq("participant_id", participant.id)
      .eq("room_id", participant.room_id)
      .eq("status", "UNPAID");

    if (hasFineId) {
      finesQuery = finesQuery.eq("id", (body as { fineId: string }).fineId);
    }

    const { data: fines, error: finesError } = await finesQuery;

    if (finesError) {
      console.error("Fine payment lookup failed:", finesError);

      return NextResponse.json(
        { error: "Unable to load your outstanding fines." },
        { status: 500 },
      );
    }

    if (!fines || fines.length === 0) {
      return NextResponse.json(
        {
          error: hasFineId
            ? "This fine is not outstanding or does not belong to you."
            : "You have no outstanding fines to pay.",
        },
        { status: 400 },
      );
    }

    // 5. Validate amounts and convert naira to kobo.
    const unpaidFines = fines as UnpaidFine[];

    const invalidFine = unpaidFines.find(
      (fine) => !Number.isSafeInteger(fine.amount) || fine.amount <= 0,
    );

    if (invalidFine) {
      return NextResponse.json(
        { error: "An outstanding fine has an invalid amount." },
        { status: 400 },
      );
    }

    const totalNaira = unpaidFines.reduce(
      (total, fine) => total + fine.amount,
      0,
    );

    const totalKobo = totalNaira * 100;

    if (
      !Number.isSafeInteger(totalNaira) ||
      !Number.isSafeInteger(totalKobo) ||
      totalKobo <= 0
    ) {
      return NextResponse.json(
        { error: "The total payment amount is invalid." },
        { status: 400 },
      );
    }

    const fineIds = unpaidFines.map((fine) => fine.id);
    const reference = `FINE-${crypto.randomUUID()}`;

    // 6. Record one payment row per fine.
    // All rows for this checkout share the same Paystack reference.
    const paymentRows = unpaidFines.map((fine) => ({
      fine_id: fine.id,
      participant_id: participant.id,
      amount: fine.amount * 100, // fine amount is stored in naira
      status: "PENDING" as const,
      paystack_reference: reference,
    }));

    const { error: insertError } = await admin
      .from("fine_payments")
      .insert(paymentRows);

    if (insertError) {
      console.error("Fine payment record creation failed:", insertError);

      return NextResponse.json(
        { error: "Unable to prepare your fine payment." },
        { status: 500 },
      );
    }

    // 7. Initialize Paystack checkout.
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!secretKey || !appUrl) {
      console.error(
        "Fine payment initialization requires PAYSTACK_SECRET_KEY and NEXT_PUBLIC_APP_URL.",
      );

      await admin
        .from("fine_payments")
        .update({ status: "FAILED" })
        .eq("paystack_reference", reference)
        .eq("status", "PENDING");

      return NextResponse.json(
        { error: "Payment service is not configured." },
        { status: 500 },
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      await admin
        .from("fine_payments")
        .update({ status: "FAILED" })
        .eq("paystack_reference", reference)
        .eq("status", "PENDING");

      return NextResponse.json(
        { error: "Your account must have an email address to pay." },
        { status: 400 },
      );
    }

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: totalKobo,
          currency: "NGN",
          reference,
          callback_url: `${process.env.APP_URL}/result-room/dashboard/`,
          metadata: {
            payment_type: "fine",
            participant_id: participant.id,
            room_id: participant.room_id,
            fine_ids: fineIds,
            fine_count: fineIds.length,
          },
        }),
        cache: "no-store",
      },
    );

    const paystackResult = (await paystackResponse.json()) as {
      status?: boolean;
      message?: string;
      data?: {
        authorization_url?: string;
        access_code?: string;
        reference?: string;
      };
    };

    if (
      !paystackResponse.ok ||
      !paystackResult.status ||
      !paystackResult.data?.authorization_url ||
      paystackResult.data.reference !== reference
    ) {
      console.error("Paystack fine initialization failed:", {
        httpStatus: paystackResponse.status,
        message: paystackResult.message,
        reference,
      });

      await admin
        .from("fine_payments")
        .update({ status: "FAILED" })
        .eq("paystack_reference", reference)
        .eq("status", "PENDING");

      return NextResponse.json(
        {
          error:
            "Paystack could not initialize your payment. Please try again.",
        },
        { status: 502 },
      );
    }

    // 8. Return the checkout URL to the existing page.
    return NextResponse.json({
      authorizationUrl: paystackResult.data.authorization_url,
      reference,
      amount: totalKobo,
      currency: "NGN",
      fineCount: fineIds.length,
      fineIds,
    });
  } catch (error) {
    console.error("Unexpected fine payment initialization error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred while preparing your payment." },
      { status: 500 },
    );
  }
}
