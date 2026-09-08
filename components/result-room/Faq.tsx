"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import gsap from "gsap";
import {
  Plus,
  Minus,
  RefreshCcw,
  Sparkles,
  ShieldCheck,
  Headset,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BG = "#e7edf6";
const RAISED = "7px 7px 15px #c3cddb, -7px -7px 15px #ffffff";
const RAISED_SM = "4px 4px 9px #c3cddb, -4px -4px 9px #ffffff";
const PRESSED = "inset 5px 5px 10px #c3cddb, inset -5px -5px 10px #ffffff";

type FaqItem = {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  body: string;
};

const ITEMS: FaqItem[] = [
  {
    icon: RefreshCcw,
    iconColor: "text-blue-500",
    title: "What is The Result Room",
    body: "The Result Room is a strict, 90-day execution and accountability space designed to help you focus and achieve your goals without making excuses.",
  },
  {
    icon: Sparkles,
    iconColor: "text-indigo-500",
    title: " How much does it cost to join?",
    body: "The entry fee is N10,600. However, you can secure your spot with a minimum deposit of N5,000 and pay the rest in installments with zero extra charges.",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-sky-500",
    title: "What happens if I fail to do my daily tasks?",
    body: "You are given exactly 5 excuse slots for unexpected situations. Once you use them up, you will pay a N500 penalty fee directly to the Uprix account for every daily task you miss.",
  },
  {
    icon: Headset,
    iconColor: "text-cyan-500",
    title: "Can I get kicked out of the room?",
    body: "Yes. If you fail to show up for 5 days without any explanation, you will be evicted from the room.",
  },
  {
    icon: Sparkles,
    iconColor: "text-indigo-500",
    title: "Will I be working on my goals alone?",
    body: "No. You will be paired with a 1-on-1 accountability partner to track your progress transparently for the full 3 months.",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-sky-500",
    title: "What happens before I enter the room?",
    body: "Before entering, you will have a Consultation Call with Taifaq to review your specific goal and set up a clear execution system.",
  },
  {
    icon: Headset,
    iconColor: "text-cyan-500",
    title: "Can I get a refund if I change my mind?",
    body: "No, payments are non-refundable. Once you make a deposit, you get instant access to the Consultation Call and valuable resources worth N15,000.",
  },
];

type AccordionItemProps = {
  item: (typeof ITEMS)[number];
  isOpen: boolean;
  onToggle: () => void;
  itemRef: (element: HTMLDivElement | null) => void;
};

function AccordionItem({
  item,
  isOpen,
  onToggle,
  itemRef,
}: AccordionItemProps) {
  const Icon = item.icon;

  return (
    <div
      ref={itemRef}
      className="rounded-2xl transition-shadow duration-300"
      style={{ background: BG, boxShadow: isOpen ? PRESSED : RAISED }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-secondary-blue/50 focus-visible:ring-inset"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: BG, boxShadow: RAISED_SM }}
        >
          <Icon size={17} className={item.iconColor} />
        </div>
        <span className="flex-1 font-heading text-sm text-secondary-blue">
          {item.title}
        </span>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ${
            isOpen ? "rotate-180 text-blue-500" : "text-blue-500"
          }`}
          style={{ background: BG, boxShadow: RAISED_SM }}
        >
          {isOpen ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </button>

      {/* height-animated content via grid-template-rows */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p
            className={`px-6 pb-5 font-body text-[13px] leading-relaxed text-neutral-600 transition-opacity duration-300 ${
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
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.fromTo(
      itemRefs.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 },
    );
  }, []);

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
            itemRef={(element) => {
              itemRefs.current[i] = element;
            }}
          />
        ))}
      </div>
    </div>
  );
}
