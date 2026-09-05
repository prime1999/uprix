import { createClient } from "@/lib/supabase/server";
import PaymentSuccessCard from "@/components/payment/paymentSuccessCard";

type Props = {
  searchParams: Promise<{
    reference?: string;
    trxref?: string;
  }>;
};

export default async function PaymentCallback({ searchParams }: Props) {
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

  const supabase = await createClient();

  /*
   * 1. Find the payment using the Paystack reference.
   *
   * The reference is unique in your payments table.
   */
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
        paid_at
      `,
    )
    .eq("reference", reference)
    .maybeSingle();

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

  /*
   * The webhook may not have finished processing
   * when the user reaches the callback.
   */
  if (!payment) {
    return (
      <PaymentSuccessCard
        status="PENDING"
        reference={reference}
        message="Your payment was received by Paystack. We're confirming it now. Please refresh in a moment."
      />
    );
  }

  /*
   * Payment exists, but wasn't marked successful.
   */
  if (payment.status !== "SUCCESS") {
    return (
      <PaymentSuccessCard
        status="FAILED"
        reference={payment.reference}
        message="This payment has not been confirmed as successful."
      />
    );
  }

  /*
   * 2. Get the participant belonging to this payment.
   */
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

  /*
   * 3. Get the actual entry fee from room_settings.
   *
   * Nothing is hardcoded here.
   */
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

  /*
   * 4. Determine the correct UI state from the database.
   */
  const status =
    participant.status === "FULLY_PAID"
      ? "FULLY_PAID"
      : participant.status === "PARTIALLY_PAID"
        ? "PARTIALLY_PAID"
        : "PENDING";

  /*
   * 5. Send real database values to the UI.
   *
   * All amounts are stored in kobo.
   */
  return (
    <PaymentSuccessCard
      status={status}
      fullName={participant.full_name}
      paidAmount={participant.total_paid}
      totalAmount={roomSettings.entry_fee}
      balance={participant.balance}
      seatNumber={participant.seat_number}
      reference={payment.reference}
    />
  );
}
