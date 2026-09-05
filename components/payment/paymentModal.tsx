"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import logo from "@/app/assets/images/mobileLogo.png";

/* ---------------------------------------------------------
   Small pie/radio indicator used on each payment option.
   100% renders as a solid filled circle (selected look),
   partial percentages render as a mini pie inside a
   dashed ring.
--------------------------------------------------------- */
function PieIndicator({
  percent,
  selected,
}: {
  percent: number;
  selected: boolean;
}) {
  const fill = selected ? "#ffffff" : "#07017b";
  const ring = selected ? "rgba(255,255,255,0.45)" : "#d1d5db";

  return (
    <span
      className="relative inline-flex items-center justify-center w-7 h-7 rounded-full border-2 border-dashed shrink-0"
      style={{ borderColor: ring }}
    >
      <span
        className="absolute inset-[3px] rounded-full"
        style={{
          background:
            percent >= 100
              ? fill
              : `conic-gradient(${fill} ${percent}%, transparent ${percent}% 100%)`,
        }}
      />
    </span>
  );
}

const OPTIONS = [
  {
    id: "full",
    label: "Full price",
    price: "N10,600",
    percent: 100,
    value: 10600,
  },
  {
    id: "50",
    label: "Installments",
    price: "N5,000 now",
    percent: 45,
    value: 5000,
  },
];

export default function PaymentModal() {
  const [selected, setSelected] = useState("full");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [goal, setGoal] = useState<string>("");
  const [amount, setAmount] = useState<number>(10600);

  const handlePayment = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      console.log({ phoneNumber, amount });
      const amountInKobo = amount * 100; // Convert to kobo
      const response = await fetch("/api/result/payment/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInKobo,
          phoneNumber: phoneNumber.toString(),
          goal,
        }),
      });

      const data = await response.json();
      console.log({ data });

      if (!response.ok) {
        throw new Error(data.error);
      }

      window.location.href = data.authorizationUrl;
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  return (
    <form className="w-full flex items-center justify-center px-4">
      <div className="relative">
        {/* icon */}
        <div className="flex justify-center mt-2 mb-5">
          <Image src={logo} alt="logo" width={60} height={60} />
        </div>

        {/* heading */}
        <h1 className="text-center text-[1.4rem] font-bold text-neutral-900 mb-2">
          I want to Join Result Room
        </h1>
        <p className="text-center text-[13px] text-neutral-500 leading-relaxed px-2 mb-4">
          Payment flexibility is available, allowing you to pay in{" "}
          <span className="font-bold">full</span> or in installments with a{" "}
          <span className="font-bold">5000 Naira</span> down payment.
        </p>

        {/* phone number */}
        <div className="mb-3">
          <input
            id="phone-number"
            type="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="Enter your Whatsapp number"
            autoComplete="tel"
            required
            className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-secondary-blue focus:ring-2 focus:ring-secondary-blue/10"
          />
          <input
            id="goal"
            type="text"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="Enter your primary goal"
            required
            className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 mt-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-secondary-blue focus:ring-2 focus:ring-secondary-blue/10"
          />
        </div>

        {/* options grid */}
        <div className="grid grid-cols-2 gap-3">
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSelected(opt.id);
                  setAmount(opt.value);
                }}
                className={`text-left rounded-2xl px-4 py-3.5 flex items-center gap-3 transition ${
                  isSelected
                    ? "bg-secondary-blue shadow-md"
                    : "bg-neutral-100 hover:bg-neutral-200/70"
                }`}
              >
                <PieIndicator percent={opt.percent} selected={isSelected} />
                <span className="min-w-0">
                  <span
                    className={`block text-[13px] font-semibold truncate ${
                      isSelected ? "text-white" : "text-neutral-900"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span
                    className={`block text-[11px] truncate ${
                      isSelected ? "text-white/60" : "text-neutral-400"
                    }`}
                  >
                    {opt.price}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* footer nav */}
        <div className="w-full mt-12">
          <button
            type="button"
            onClick={(e) => handlePayment(e)}
            className="w-full inline-flex items-center justify-center gap-1 bg-blue-800 text-white text-[13px] font-semibold rounded-full px-5 py-2.5 hover:bg-blue-900 active:scale-95 transition"
          >
            Proceed with payment
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </form>
  );
}
