import { Suspense } from "react";
import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";
import PaymentSuccessCard from "@/components/payment/paymentSuccessCard";

type Props = {
  searchParams: Promise<{
    reference?: string;
    trxref?: string;
  }>;
};

export default function PaymentCallback({ searchParams }: Props) {
  return (
    <Suspense fallback={<PaymentCallbackSkeleton />}>
      <PaymentCallbackContent searchParams={searchParams} />
    </Suspense>
  );
}

async function PaymentCallbackContent({ searchParams }: Props) {
  // ============================================================
  // 0. RUN THIS ROUTE AT REQUEST TIME
  // ============================================================

  await connection();

  // ============================================================
  // 1. GET PAYMENT REFERENCE FROM PAYSTACK
  // ============================================================

  const params = await searchParams;

  const reference = params.reference || params.trxref;

  if (!reference) {
    return (
      <PaymentSuccessCard
        status="NOT_FOUND"
        message="No payment reference was found."
      />
    );
  }

  // ============================================================
  // 2. CREATE SUPABASE SERVER CLIENT
  // ============================================================

  const supabase = await createClient();

  // ============================================================
  // 3. FIND PAYMENT BY PAYSTACK REFERENCE
  // ============================================================

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select(
      `
        id,
        participant_id,
        amount,
        reference,
        provider,
        status,
        paid_at,
        created_at
      `,
    )
    .eq("reference", reference)
    .maybeSingle();

  // ============================================================
  // 4. PAYMENT LOOKUP ERROR
  // ============================================================

  if (paymentError) {
    console.error("Payment lookup error:", paymentError);

    return (
      <PaymentSuccessCard
        status="PENDING"
        reference={reference}
        message="We're still confirming your payment. Please refresh in a moment."
      />
    );
  }

  // ============================================================
  // 5. WEBHOOK MAY NOT HAVE FINISHED YET
  // ============================================================

  if (!payment) {
    return (
      <PaymentSuccessCard
        status="PENDING"
        reference={reference}
        message="Your payment was received by Paystack. We're confirming it now. Please refresh in a moment."
      />
    );
  }

  // ============================================================
  // 6. CHECK PAYMENT STATUS
  // ============================================================

  if (payment.status !== "SUCCESS") {
    return (
      <PaymentSuccessCard
        status="FAILED"
        reference={payment.reference}
        message="This payment has not been confirmed as successful."
      />
    );
  }

  // ============================================================
  // 7. GET PARTICIPANT
  // ============================================================

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .select(
      `
        id,
        room_id,
        full_name,
        email,
        total_paid,
        balance,
        status,
        seat_number
      `,
    )
    .eq("id", payment.participant_id)
    .single();

  // ============================================================
  // 8. PARTICIPANT LOOKUP ERROR
  // ============================================================

  if (participantError || !participant) {
    console.error("Participant lookup error:", participantError);

    return (
      <PaymentSuccessCard
        status="PENDING"
        reference={payment.reference}
        message="Your payment was received, but we're still completing your registration."
      />
    );
  }

  // ============================================================
  // 9. GET ROOM SETTINGS
  // ============================================================

  const { data: roomSettings, error: settingsError } = await supabase
    .from("room_settings")
    .select(
      `
        entry_fee,
        minimum_deposit,
        capacity
      `,
    )
    .eq("room_id", participant.room_id)
    .single();

  // ============================================================
  // 10. ROOM SETTINGS ERROR
  // ============================================================

  if (settingsError || !roomSettings) {
    console.error("Room settings lookup error:", settingsError);

    return (
      <PaymentSuccessCard
        status="PENDING"
        reference={payment.reference}
        message="Your payment was received, but we're still loading your Result Room information."
      />
    );
  }

  // ============================================================
  // 11. GET ALL SUCCESSFUL PAYMENTS FOR THIS PARTICIPANT
  // ============================================================

  const { data: successfulPayments, error: successfulPaymentsError } =
    await supabase
      .from("payments")
      .select(
        `
        id,
        paid_at,
        created_at
      `,
      )
      .eq("participant_id", participant.id)
      .eq("status", "SUCCESS")
      .order("created_at", {
        ascending: true,
      })
      .order("id", {
        ascending: true,
      });

  // ============================================================
  // 12. SUCCESSFUL PAYMENTS LOOKUP ERROR
  // ============================================================

  if (successfulPaymentsError || !successfulPayments) {
    console.error("Successful payments lookup error:", successfulPaymentsError);

    return (
      <PaymentSuccessCard
        status="PENDING"
        reference={payment.reference}
        message="Your payment was received, but we're still completing your registration."
      />
    );
  }

  // ============================================================
  // 13. DETERMINE IF THIS IS THE FIRST PAYMENT
  // ============================================================

  const firstSuccessfulPayment = successfulPayments[0];

  const isFirstPayment =
    successfulPayments.length > 0 && firstSuccessfulPayment.id === payment.id;

  // ============================================================
  // 14. DETERMINE FULL PAYMENT STATUS
  // ============================================================

  const isFullyPaid = participant.status === "FULLY_PAID";

  // ============================================================
  // 15. DETERMINE UI STATUS
  // ============================================================

  const status =
    participant.status === "FULLY_PAID"
      ? "FULLY_PAID"
      : participant.status === "PARTIALLY_PAID"
        ? "PARTIALLY_PAID"
        : "PENDING";

  // ============================================================
  // 16. LOG EVERYTHING FOR TESTING
  // ============================================================

  console.log("Result Room payment callback:", {
    reference: payment.reference,
    paymentId: payment.id,
    participantId: participant.id,
    paymentAmount: payment.amount,
    totalPaid: participant.total_paid,
    balance: participant.balance,
    participantStatus: participant.status,
    isFirstPayment,
    isFullyPaid,
  });

  // ============================================================
  // 17. RETURN PAYMENT SUCCESS CARD
  // ============================================================

  return (
    <PaymentSuccessCard
      status={status}
      fullName={participant.full_name}
      email={participant.email}
      paidAmount={participant.total_paid}
      totalAmount={roomSettings.entry_fee}
      balance={participant.balance}
      seatNumber={participant.seat_number}
      reference={payment.reference}
      isFirstPayment={isFirstPayment}
      isFullyPaid={isFullyPaid}
    />
  );
}

// ============================================================
// SKELETON
// ============================================================

function PaymentCallbackSkeleton() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900/40 p-8 animate-pulse">
        <div className="h-8 w-48 bg-neutral-800 rounded-lg mb-4" />
        <div className="h-4 w-full bg-neutral-800 rounded mb-2" />
        <div className="h-4 w-3/4 bg-neutral-800 rounded mb-8" />
        <div className="h-12 w-full bg-neutral-800 rounded-xl" />
      </div>
    </div>
  );
}
