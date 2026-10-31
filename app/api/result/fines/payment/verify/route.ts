import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type PaymentRecord = {
  id: string;
  fine_id: string;
  participant_id: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "ABANDONED";
  paystack_reference: string;
  paid_at: string | null;
};

type PaystackVerifyResponse = {
  status: boolean;
  message?: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at: string | null;
  };
};

function response(
  status: "success" | "pending" | "error",
  message: string,
  httpStatus = 200,
) {
  return NextResponse.json({ status, message }, { status: httpStatus });
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
      return response("error", "Please sign in to verify your payment.", 401);
    }

    // 2. Validate the reference supplied by the dashboard.
    let body: { reference?: unknown };

    try {
      body = await request.json();
    } catch {
      return response("error", "Invalid request body.", 400);
    }

    const reference = body.reference;

    if (
      typeof reference !== "string" ||
      !/^FINE-[0-9a-f-]{36}$/i.test(reference)
    ) {
      return response("error", "Invalid payment reference.", 400);
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error("PAYSTACK_SECRET_KEY is not configured.");

      return response(
        "error",
        "Payment verification is temporarily unavailable.",
        500,
      );
    }

    const admin = createAdminClient();

    // 3. Find every payment record associated with this checkout.
    const { data: payments, error: paymentsError } = await admin
      .from("fine_payments")
      .select(
        "id, fine_id, participant_id, amount, status, paystack_reference, paid_at",
      )
      .eq("paystack_reference", reference);

    if (paymentsError) {
      console.error("Fine payment lookup failed:", paymentsError);

      return response("error", "Unable to load the payment records.", 500);
    }

    const paymentRecords = (payments ?? []) as PaymentRecord[];

    if (paymentRecords.length === 0) {
      return response(
        "error",
        "No fine payment was found for this reference.",
        404,
      );
    }

    // A checkout must not contain duplicate fine records.
    const fineIds = paymentRecords.map((payment) => payment.fine_id);

    if (new Set(fineIds).size !== fineIds.length) {
      console.error("Duplicate fine IDs found for reference:", reference);

      return response("error", "The payment records need to be reviewed.", 409);
    }

    // 4. Ensure the authenticated user owns these payment records.
    const participantIds = [
      ...new Set(paymentRecords.map((payment) => payment.participant_id)),
    ];

    const { data: participants, error: participantError } = await admin
      .from("participants")
      .select("id")
      .eq("user_id", userId)
      .in("id", participantIds);

    if (participantError) {
      console.error("Participant ownership check failed:", participantError);

      return response("error", "Unable to verify your account.", 500);
    }

    if (
      !participants ||
      participants.length !== 1 ||
      participantIds.length !== 1 ||
      participants[0].id !== paymentRecords[0].participant_id
    ) {
      return response(
        "error",
        "You are not authorized to verify this payment.",
        403,
      );
    }

    // 5. Ask Paystack for the authoritative transaction status.
    let paystackResponse: Response;

    try {
      paystackResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
          cache: "no-store",
        },
      );
    } catch (error) {
      console.error("Paystack verification request failed:", error);

      return response(
        "pending",
        "We could not confirm the payment yet. Please try again.",
      );
    }

    const result = (await paystackResponse.json()) as PaystackVerifyResponse;

    if (!paystackResponse.ok || !result.status || !result.data) {
      console.error("Paystack verification returned an error:", {
        reference,
        httpStatus: paystackResponse.status,
        message: result.message,
      });

      // A temporary verification/API error does not prove payment failure.
      return response(
        "pending",
        "Your payment status could not be confirmed yet. Please try again.",
      );
    }

    const transaction = result.data;

    // 6. Confirm transaction identity, currency, and exact total.
    const expectedAmount = paymentRecords.reduce(
      (total, payment) => total + payment.amount,
      0,
    );

    if (
      transaction.reference !== reference ||
      transaction.currency !== "NGN" ||
      !Number.isSafeInteger(transaction.amount) ||
      !Number.isSafeInteger(expectedAmount) ||
      transaction.amount !== expectedAmount
    ) {
      console.error("Fine payment verification mismatch:", {
        reference,
        returnedReference: transaction.reference,
        returnedCurrency: transaction.currency,
        returnedAmount: transaction.amount,
        expectedAmount,
      });

      return response(
        "error",
        "The transaction details do not match this payment.",
        409,
      );
    }

    // 7. Handle a transaction that is not yet successful.
    if (transaction.status !== "success") {
      if (
        ["pending", "ongoing", "processing", "queued"].includes(
          transaction.status,
        )
      ) {
        return response("pending", "Your payment is still being processed.");
      }

      if (["failed", "abandoned", "reversed"].includes(transaction.status)) {
        return response("error", "The payment was not completed successfully.");
      }

      return response(
        "pending",
        "Your payment status is not final yet. Please try again.",
      );
    }

    // 8. Confirm the payment records still represent a valid checkout.
    const allAlreadyProcessed = paymentRecords.every(
      (payment) => payment.status === "SUCCESS" && payment.paid_at,
    );

    let paidAt = transaction.paid_at;

    if (!paidAt || Number.isNaN(Date.parse(paidAt))) {
      if (allAlreadyProcessed) {
        paidAt = paymentRecords[0].paid_at;
      } else {
        return response(
          "pending",
          "Paystack confirmed the transaction, but its payment timestamp is unavailable. Please try again.",
        );
      }
    }

    // 9. Atomically mark payment rows and fines as paid.
    const { data: completion, error: completionError } = await admin.rpc(
      "complete_fine_payment",
      {
        p_reference: reference,
        p_paid_at: paidAt,
      },
    );

    if (completionError) {
      console.error("Fine payment completion failed:", {
        reference,
        error: completionError,
      });

      return response(
        "pending",
        "Payment was confirmed, but updating your fine records is taking longer than expected. Please retry verification.",
      );
    }

    if (
      !completion ||
      typeof completion !== "object" ||
      completion.status !== "success"
    ) {
      console.error("Fine payment RPC did not confirm completion:", {
        reference,
        completion,
      });

      return NextResponse.json(
        {
          status: "pending",
          message: "Payment received, but confirmation is still processing.",
          reference,
        },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("Unexpected fine payment verification error:", error);

    return response(
      "error",
      "An unexpected error occurred while verifying your payment.",
      500,
    );
  }
}
