"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronRight } from "lucide-react";

import logo from "@/app/assets/images/mobileLogo.png";

type Participant = {
  id: string;
  full_name: string;
  total_paid: number;
  balance: number;
  status: string;
  seat_number: number | null;
};

type ContinuePaymentModalProps = {
  participant: Participant;
};

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

function getPaymentOptions(balance: number) {
  const options: number[] = [];

  for (let amount = 100000; amount < balance; amount += 100000) {
    options.push(amount);
  }

  options.push(balance);

  return [...new Set(options)];
}

export default function ContinuePaymentModal({
  participant,
}: ContinuePaymentModalProps) {
  const options = getPaymentOptions(participant.balance);

  const [selectedAmount, setSelectedAmount] = useState(options[0]);

  const progress =
    (participant.total_paid / (participant.total_paid + participant.balance)) *
    100;

  const handlePayment = async () => {
    try {
      const response = await fetch("/api/result/payment/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: selectedAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      window.location.href = data.authorizationUrl;
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  return (
    <div className="w-full flex items-center justify-center px-4 h-[500px] overflow-y-auto">
      <div className="w-full relative">
        {/* Logo */}
        <div className="flex justify-center mt-2 mb-5">
          <Image src={logo} alt="logo" width={60} height={60} />
        </div>

        {/* Heading */}
        <h1 className="text-center text-[1.4rem] font-bold text-neutral-900 mb-2">
          Complete your Result Room payment
        </h1>

        <p className="text-center text-[13px] text-neutral-500 leading-relaxed px-2 mb-5">
          You're already registered. Complete your remaining balance to secure
          your official seat.
        </p>

        {/* Payment summary */}
        <div className="rounded-2xl bg-neutral-100 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-neutral-500">
              Payment progress
            </span>

            <span className="text-[12px] font-semibold text-secondary-blue">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-secondary-blue transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-[11px] text-neutral-400">Paid</p>
              <p className="text-sm font-bold text-neutral-900">
                {formatNaira(participant.total_paid)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[11px] text-neutral-400">Remaining</p>
              <p className="text-sm font-bold text-secondary-blue">
                {formatNaira(participant.balance)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment options */}
        <p className="text-[12px] font-semibold text-neutral-700 mb-2">
          Choose payment amount
        </p>

        <div className="grid grid-cols-2 gap-2">
          {options.map((amount) => {
            const selected = selectedAmount === amount;

            return (
              <button
                key={amount}
                type="button"
                onClick={() => setSelectedAmount(amount)}
                className={`rounded-xl px-3 py-3 text-left transition ${
                  selected
                    ? "bg-secondary-blue text-white shadow-md"
                    : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200/70"
                }`}
              >
                <span className="block text-[13px] font-semibold">
                  {formatNaira(amount)}
                </span>

                <span
                  className={`block text-[10px] mt-0.5 ${
                    selected ? "text-white/60" : "text-neutral-400"
                  }`}
                >
                  {amount === participant.balance
                    ? "Complete payment"
                    : "Installment"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action */}
        <div className="w-full mt-4">
          <button
            type="button"
            onClick={handlePayment}
            className="w-full inline-flex items-center justify-center gap-1 bg-blue-800 text-white text-[13px] font-semibold rounded-full px-5 py-2.5 hover:bg-blue-900 active:scale-95 transition"
          >
            Pay {formatNaira(selectedAmount)}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
