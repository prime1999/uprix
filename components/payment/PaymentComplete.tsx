"use client";

import Image from "next/image";
import { ChevronRight, Check, Link } from "lucide-react";

import logo from "@/app/assets/images/mobileLogo.png";

type Participant = {
  full_name: string;
  total_paid: number;
  balance: number;
  seat_number: number | null;
};

type PaymentCompletedCardProps = {
  participant: Participant;
};

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

export default function PaymentCompletedCard({
  participant,
}: PaymentCompletedCardProps) {
  const whatsappNumber = "2347025120945";
  const whatsappMessage = `Hello Taifaq 👋

My name is ${participant.full_name ?? ""}. I have completed my full payment for The Result Room 2.0.

*Seat Number: ${participant.seat_number?.toString().padStart(3, "0") ?? "Not assigned yet"}*

I'm excited to be part of the room and get started!

Thank you!`;
  return (
    <div className="w-full flex items-center justify-center px-4">
      <div className="w-full relative">
        {/* Logo */}
        <div className="flex justify-center mt-2 mb-5">
          <Image src={logo} alt="logo" width={60} height={60} />
        </div>

        {/* Success icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <Check size={22} className="text-green-600" strokeWidth={2.5} />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-center text-[1.4rem] font-bold text-neutral-900 mb-2">
          You're officially in!
        </h1>

        <p className="text-center text-[13px] text-neutral-500 leading-relaxed px-3 mb-5">
          Your payment is complete and your place in The Result Room is secured.
        </p>

        {/* Details */}
        <div className="rounded-2xl bg-neutral-100 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-neutral-500">Participant</span>

            <span className="text-[13px] font-semibold text-neutral-900">
              {participant.full_name}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[12px] text-neutral-500">Amount paid</span>

            <span className="text-[13px] font-semibold text-neutral-900">
              {formatNaira(participant.total_paid)}
            </span>
          </div>

          <div className="h-px bg-neutral-200" />

          <div className="flex items-center justify-between">
            <span className="text-[12px] text-neutral-500">Seat</span>

            <span className="text-[13px] font-bold text-secondary-blue">
              {participant.seat_number
                ? `#${participant.seat_number}`
                : "Assigned"}
            </span>
          </div>
        </div>

        {/* Access message */}
        <div className="mt-4 rounded-xl border border-secondary-blue/10 bg-secondary-blue/5 px-4 py-3">
          <p className="text-[11px] text-secondary-blue leading-relaxed text-center">
            You now have access to your Result Room resources and conversations.
          </p>
        </div>

        {/* CTA */}
        <div className="w-full mt-4">
          <Link
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
            className="w-full mb-2 flex items-center justify-center gap-1 bg-green-800 text-white text-[13px] font-semibold rounded-full px-5 py-2.5 hover:bg-green-900 active:scale-95 transition"
          >
            Yet to join the Antechamber?
            <ChevronRight size={14} />
          </Link>
          <button
            type="button"
            className="w-full inline-flex items-center justify-center gap-1 bg-blue-800 text-white text-[13px] font-semibold rounded-full px-5 py-2.5 hover:bg-blue-900 active:scale-95 transition"
          >
            Enter Result Room
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
