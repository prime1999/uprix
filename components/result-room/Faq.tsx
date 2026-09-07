"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    title: "What is The Result Room",
    body: "The Result Room is a strict, 90-day execution and accountability space designed to help you focus and achieve your goals without making excuses.",
  },
  {
    title: " How much does it cost to join?",
    body: "The entry fee is N10,600. However, you can secure your spot with a minimum deposit of N5,000 and pay the rest in installments with zero extra charges.",
  },
  {
    title: "What happens if I fail to do my daily tasks?",
    body: "You are given exactly 5 excuse slots for unexpected situations. Once you use them up, you will pay a N500 penalty fee directly to the Uprix account for every daily task you miss.",
  },
  {
    title: "Can I get kicked out of the room?",
    body: "Yes. If you fail to show up for 5 days without any explanation, you will be evicted from the room.",
  },
  {
    title: "Will I be working on my goals alone?",
    body: "No. You will be paired with a 1-on-1 accountability partner to track your progress transparently for the full 3 months.",
  },
  {
    title: "What happens before I enter the room?",
    body: "Before entering, you will have a Consultation Call with Taifaq to review your specific goal and set up a clear execution system.",
  },
  {
    title: "Can I get a refund if I change my mind?",
    body: "No, payments are non-refundable. Once you make a deposit, you get instant access to the Consultation Call and valuable resources worth N15,000.",
  },
];

type AccordionItemProps = {
  item: (typeof ITEMS)[number];
  isOpen: boolean;
  onToggle: () => void;
};

function AccordionItem({ item, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 ${
        isOpen
          ? "border-white/60 bg-white/30 shadow-[0_15px_35px_rgba(31,38,135,0.15),inset_0_1px_0_rgba(255,255,255,0.65)]"
          : "border-white/35 bg-white/15 shadow-[0_8px_20px_rgba(31,38,135,0.08),inset_0_1px_0_rgba(255,255,255,0.45)] hover:border-white/50 hover:bg-white/20"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-secondary-blue/50 focus-visible:ring-inset"
      >
        <span className="font-heading text-sm text-secondary-blue">
          {item.title}
        </span>
        <span
          className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 ${
            isOpen
              ? "bg-neutral-900 text-white rotate-180"
              : "bg-white/50 text-neutral-700"
          }`}
        >
          {isOpen ? <Minus size={13} /> : <Plus size={13} />}
        </span>
      </button>

      {/* height-animated content via grid-template-rows */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p
            className={`px-6 pb-5 text-[13px] leading-relaxed text-neutral-600 font-body transition-opacity duration-300 ${
              isOpen ? "opacity-100 delay-100" : "opacity-0"
            }`}
          >
            {item.body}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GlassAccordion({ className }: { className?: string }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div
      className={cn(
        "min-h-screen w-full relative flex items-center justify-center p-6 overflow-hidden",
        className,
      )}
    >
      <div className="relative w-full max-w-md space-y-4">
        {ITEMS.map((item, i) => (
          <AccordionItem
            key={item.title}
            item={item}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          />
        ))}
      </div>
    </div>
  );
}
