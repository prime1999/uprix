"use client";

import React, { useRef, useState } from "react";

import { Check, Clock, ExternalLink, MessageCircle, X } from "lucide-react";

import Link from "next/link";

type PaymentStatus =
  | "FULLY_PAID"
  | "PARTIALLY_PAID"
  | "PENDING"
  | "FAILED"
  | "NOT_FOUND";

type PaymentSuccessCardProps = {
  status: PaymentStatus;

  paidAmount?: number;
  totalAmount?: number;
  balance?: number;
  seatNumber?: number | null;

  fullName?: string;
  email?: string;
  reference?: string;
  message?: string;

  // Payment state
  isFirstPayment?: boolean;
  isFullyPaid?: boolean;
};

function SuccessBadge() {
  return (
    <div
      className="relative h-20 w-20"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute left-1/2 -bottom-2 h-3 w-14 -translate-x-1/2 rounded-full bg-emerald-900/20 blur-md" />

      <div
        className="absolute inset-0 rounded-[1.5rem]"
        style={{
          background:
            "linear-gradient(155deg, #6ee7b7 0%, #22c55e 45%, #15803d 100%)",
          boxShadow:
            "0 14px 24px rgba(21,128,61,0.35), inset 0 2px 3px rgba(255,255,255,0.5), inset 0 -6px 10px rgba(0,0,0,0.25)",
        }}
      />

      <div
        className="absolute left-2 top-1.5 h-6 w-10 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.8) 0%, transparent 70%)",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <Check
          size={30}
          strokeWidth={3.5}
          className="text-white drop-shadow-sm"
        />
      </div>
    </div>
  );
}

function PendingBadge() {
  return (
    <div
      className="flex h-20 w-20 items-center justify-center rounded-[1.5rem]"
      style={{
        background:
          "linear-gradient(155deg, #fde68a 0%, #f59e0b 55%, #b45309 100%)",
        boxShadow:
          "0 14px 24px rgba(180,83,9,0.25), inset 0 2px 3px rgba(255,255,255,0.5)",
      }}
    >
      <Clock size={30} strokeWidth={3} className="text-white" />
    </div>
  );
}

function FailedBadge() {
  return (
    <div
      className="flex h-20 w-20 items-center justify-center rounded-[1.5rem]"
      style={{
        background:
          "linear-gradient(155deg, #fca5a5 0%, #ef4444 55%, #b91c1c 100%)",
        boxShadow:
          "0 14px 24px rgba(185,28,28,0.25), inset 0 2px 3px rgba(255,255,255,0.5)",
      }}
    >
      <X size={30} strokeWidth={3} className="text-white" />
    </div>
  );
}

export default function PaymentSuccessCard({
  status,
  paidAmount = 0,
  totalAmount = 0,
  balance = 0,
  seatNumber = null,
  fullName,
  email,
  reference,
  message,
  isFirstPayment = false,
  isFullyPaid = false,
}: PaymentSuccessCardProps) {
  // ============================================================
  // CARD TILT
  // ============================================================

  const cardRef = useRef<HTMLDivElement>(null);

  const [tilt, setTilt] = useState({
    rx: 0,
    ry: 0,
  });

  // ============================================================
  // PAYMENT CALCULATIONS
  // ============================================================

  const percent =
    totalAmount > 0
      ? Math.min(100, Math.round((paidAmount / totalAmount) * 100))
      : 0;

  const formatNaira = (amount: number) =>
    `₦${(amount / 100).toLocaleString("en-NG")}`;

  // ============================================================
  // CARD MOUSE MOVEMENT
  // ============================================================

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;

    if (!el) return;

    const rect = el.getBoundingClientRect();

    const px = (e.clientX - rect.left) / rect.width - 0.5;

    const py = (e.clientY - rect.top) / rect.height - 0.5;

    setTilt({
      rx: py * -10,
      ry: px * 12,
    });
  };

  const handleMouseLeave = () => {
    setTilt({
      rx: 0,
      ry: 0,
    });
  };

  // ============================================================
  // PAYMENT STATES
  // ============================================================

  const isPartial = status === "PARTIALLY_PAID";

  const isPending = status === "PENDING";

  const isFailed = status === "FAILED" || status === "NOT_FOUND";

  // ============================================================
  // WHATSAPP MESSAGE
  // ============================================================
  //
  // IMPORTANT:
  //
  // We ONLY generate a WhatsApp message for the FIRST payment.
  //
  // FIRST PAYMENT + FULL PAYMENT
  // --------------------------------
  // The user paid the entire ₦10,600 at once.
  //
  // FIRST PAYMENT + PARTIAL PAYMENT
  // --------------------------------
  // The user made their first installment.
  //
  // SUBSEQUENT PAYMENT
  // --------------------------------
  // No first-payment WhatsApp message.
  //

  let whatsappMessage: string | null = null;

  if (isFirstPayment && isFullyPaid) {
    whatsappMessage = `Hello Uprix 👋

My name is ${fullName ?? ""}. I just completed my full payment for The Result Room 2.0.
<span className="font-bold">Seat Number: ${seatNumber?.toString().padStart(3, "0") ?? "Not assigned yet"}.</span>
<span className="font-bold">Email: ${email ?? ""}</span>

I'm excited to be part of the room and get started!

Thank you!`;
  } else if (isFirstPayment && !isFullyPaid) {
    whatsappMessage = `Hello Uprix 👋

My name is ${fullName ?? ""}. I just made my first payment for The Result Room 2.0.
Email: ${email ?? ""}

I'm excited to get started and continue with the program.

Thank you!`;
  }

  // ============================================================
  // WHATSAPP NUMBER
  // ============================================================
  //
  // Replace this with your actual Uprix WhatsApp number.
  //
  // Example:
  //
  // 08012345678
  //
  // becomes:
  //
  // 2348012345678
  //
  // No "+".
  // No spaces.
  // No leading "0".
  //

  const whatsappNumber = "2347025120945";

  // ============================================================
  // WHATSAPP LINK
  // ============================================================

  const whatsappLink = whatsappMessage
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        whatsappMessage,
      )}`
    : null;

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="flex min-[500px] overflow-y-auto w-full items-center justify-center p-6">
      <div style={{ perspective: "1200px" }}>
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full max-w-sm rounded-[2rem] bg-white px-7 pb-6 pt-8 transition-transform duration-200 ease-out"
          style={{
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            transformStyle: "preserve-3d",
            boxShadow:
              "0 30px 60px -15px rgba(20,40,30,0.25), 0 10px 25px rgba(20,40,30,0.08)",
          }}
        >
          {/* Badge */}

          <div className="mb-5 flex justify-center">
            {isPending ? (
              <PendingBadge />
            ) : isFailed ? (
              <FailedBadge />
            ) : (
              <SuccessBadge />
            )}
          </div>

          {/* Heading */}

          <h1 className="mb-1.5 text-center text-xl font-bold text-neutral-900">
            {isFullyPaid
              ? "Payment Successful!"
              : isPartial
                ? "Payment Received!"
                : isPending
                  ? "Payment Processing"
                  : "Payment Not Confirmed"}
          </h1>

          {/* Description */}

          <p className="mb-6 px-3 text-center text-[13px] leading-relaxed text-neutral-500">
            {message ||
              (isFullyPaid
                ? `You're officially in The Result Room 2.0${
                    fullName ? `, ${fullName}` : ""
                  }.`
                : isPartial
                  ? "Your payment has been received. Complete your remaining balance to secure your official seat."
                  : isPending
                    ? "We're confirming your payment. This usually takes only a moment."
                    : "We couldn't confirm this payment.")}
          </p>

          {/* Payment */}

          {!isFailed && !isPending && (
            <div className="mb-6 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-4">
              <div className="mb-2.5 flex items-end justify-between">
                <div>
                  <p className="mb-0.5 text-[10px] text-neutral-400">
                    Total paid
                  </p>

                  <p className="text-lg font-bold text-neutral-900">
                    {formatNaira(paidAmount)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="mb-0.5 text-[10px] text-neutral-400">
                    Total amount
                  </p>

                  <p className="text-[13px] font-semibold text-neutral-500">
                    {formatNaira(totalAmount)}
                  </p>
                </div>
              </div>

              {/* Progress */}

              <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${percent}%`,
                    background: "linear-gradient(90deg,#4ade80,#16a34a)",
                  }}
                />
              </div>

              <div className="mt-1.5 flex justify-between">
                <span className="text-[11px] font-semibold text-emerald-600">
                  {percent}% paid
                </span>

                <span className="text-[11px] text-neutral-400">
                  {formatNaira(balance)} remaining
                </span>
              </div>
            </div>
          )}

          {/* Seat */}

          {isFullyPaid && seatNumber !== null && (
            <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-600">
                Your official seat
              </p>

              <p className="mt-1 text-4xl font-bold text-emerald-700">
                {seatNumber}
              </p>
            </div>
          )}

          {/* Partial */}

          {isPartial && (
            <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center">
              <p className="text-[12px] font-medium text-amber-700">
                {formatNaira(balance)} remaining
              </p>

              <p className="mt-1 text-[11px] text-amber-600">
                Your official seat will be assigned after full payment.
              </p>
            </div>
          )}

          {/* Pending reference */}

          {isPending && reference && (
            <div className="mb-6 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
              <p className="text-[10px] text-neutral-400">Payment reference</p>

              <p className="mt-1 break-all text-[11px] font-medium text-neutral-600">
                {reference}
              </p>
            </div>
          )}

          {/* WhatsApp */}

          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.99]"
            >
              <MessageCircle size={17} />
              Click to book your call!
            </a>
          )}

          {/* Main Action */}

          {!isPending && !isFailed && (
            <Link
              href="/result-room"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.99]"
            >
              View Result Room
              <ExternalLink size={15} />
            </Link>
          )}

          {/* Pending */}

          {isPending && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.99]"
            >
              Check Again
            </button>
          )}

          {/* Failed */}

          {isFailed && (
            <button
              type="button"
              onClick={() => window.history.back()}
              className="w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.99]"
            >
              Try Payment Again
            </button>
          )}

          {/* Reference */}

          {reference && !isPending && (
            <p className="mt-5 text-center text-[10px] text-neutral-300">
              Ref: {reference}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
