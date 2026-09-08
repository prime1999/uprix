// "use client";

// import { useEffect, useRef } from "react";
// import gsap from "gsap";
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/components/ui/accordion";

// const FAQ_ITEMS = [
//   {
//     question: "What exactly is Uprix?",
//     answer:
//       "Uprix is a growth-driven community where you learn and take action that will help you grow every single day.",
//   },
//   {
//     question: "What regular activities happen in the community?",
//     answer:
//       "We have daily affirmations to build a winning mindset, bi-monthly Game Nights to unwind and win cash prizes, and X-Deep, a monthly virtual eye-opening masterclass within the community.",
//   },
//   {
//     question: "What is the X-Growth Vault?",
//     answer:
//       "It is a complete digital resource ecosystem packed with practical knowledge and guides on personal development, digital skills, business growth and more.",
//   },
//   {
//     question: "Can Uprix help me promote my business?",
//     answer:
//       "Yes. Through our Uprixtunity platform, you can put your brand on the Spotlight. We give you a stage to showcase your business and skills to a wider audience.",
//   },
//   {
//     question: "Who is Uprix built for?",
//     answer:
//       "It is for anyone who is willing to grow, learn practical skills, and get the accountability they need to achieve their goals.",
//   },
//   {
//     question: "Who are the Uprix Heralds?",
//     answer:
//       "They are active, passionate members of the community who help push Uprix major impactful events to reach more people through publicizing them. They keep the community's culture of growth alive.",
//   },
//   {
//     question: "Who will I be interacting with?",
//     answer:
//       "You will step into a supportive space surrounded by forward-thinking individuals and action-takers.",
//   },
// ];

// export default function Faq() {
//   const sectionRef = useRef<HTMLElement | null>(null);

//   useEffect(() => {
//     const context = gsap.context(() => {
//       gsap.from(".faq-heading", {
//         y: 28,
//         opacity: 0,
//         duration: 0.7,
//         ease: "power3.out",
//       });

//       gsap.from(".faq-item", {
//         y: 22,
//         opacity: 0,
//         duration: 0.55,
//         stagger: 0.08,
//         delay: 0.15,
//         ease: "power3.out",
//       });
//     }, sectionRef);

//     return () => context.revert();
//   }, []);

//   return (
//     <section
//       ref={sectionRef}
//       id="faq"
//       className="w-full overflow-hidden px-4 py-20 font-body sm:px-6 sm:py-24 lg:px-8"
//     >
//       <div className="w-11/12 md:w-8/12 lg:w-1/2 mx-auto">
//         {/* <div className="faq-heading self-start lg:sticky lg:top-24">
//           <span className="inline-block rounded-full border border-primary-blue/20 bg-primary-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-blue">
//             FAQ
//           </span>
//           <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
//             Everything you need to know about Uprix.
//           </h2>
//           <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
//             Get familiar with the community, its activities, and the people you
//             will grow alongside.
//           </p>
//         </div> */}

//         <Accordion
//           type="single"
//           collapsible
//           defaultValue="item-0"
//           className="w-full"
//         >
//           {FAQ_ITEMS.map((item, index) => (
//             <AccordionItem
//               key={item.question}
//               value={`item-${index}`}
//               className="faq-item border-border/80 py-1"
//             >
//               <AccordionTrigger className="py-5 text-base font-semibold text-foreground hover:no-underline sm:text-lg">
//                 {item.question}
//               </AccordionTrigger>
//               <AccordionContent className="max-w-2xl pb-5 text-sm leading-7 text-muted-foreground sm:text-base">
//                 {item.answer}
//               </AccordionContent>
//             </AccordionItem>
//           ))}
//         </Accordion>
//       </div>
//     </section>
//   );
// }

"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import gsap from "gsap";
import {
  ChevronDown,
  Sparkles,
  ShieldCheck,
  RefreshCcw,
  Headset,
} from "lucide-react";

/* ---------------------------------------------------------
   Neumorphic soft-UI shadows — light blue-gray base, so
   raised elements read as "pressed out" and active ones as
   "pressed in", all against the same background color.
--------------------------------------------------------- */
const BG = "#e7edf6";
const RAISED = "7px 7px 15px #c3cddb, -7px -7px 15px #ffffff";
const RAISED_SM = "4px 4px 9px #c3cddb, -4px -4px 9px #ffffff";
const PRESSED = "inset 5px 5px 10px #c3cddb, inset -5px -5px 10px #ffffff";

type FaqItem = {
  icon: LucideIcon;
  iconColor: string;
  question: string;
  answer: string;
};

const ITEMS: FaqItem[] = [
  {
    icon: RefreshCcw,
    iconColor: "text-blue-500",
    question: "What exactly is Uprix?",
    answer:
      "Uprix is a growth-driven community where you learn and take action that will help you grow every single day.",
  },
  {
    icon: Sparkles,
    iconColor: "text-indigo-500",
    question: "What regular activities happen in the community?",
    answer:
      "We have daily affirmations to build a winning mindset, bi-monthly Game Nights to unwind and win cash prizes, and X-Deep, a monthly virtual eye-opening masterclass within the community.",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-sky-500",
    question: "What is the X-Growth Vault?",
    answer:
      "It is a complete digital resource ecosystem packed with practical knowledge and guides on personal development, digital skills, business growth and more.",
  },
  {
    icon: Headset,
    iconColor: "text-cyan-500",
    question: "Can Uprix help me promote my business?",
    answer:
      "Yes. Through our Uprixtunity platform, you can put your brand on the Spotlight. We give you a stage to showcase your business and skills to a wider audience.",
  },
  {
    icon: Sparkles,
    iconColor: "text-indigo-500",
    question: "Who is Uprix built for?",
    answer:
      "It is for anyone who is willing to grow, learn practical skills, and get the accountability they need to achieve their goals.",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-sky-500",
    question: "Who are the Uprix Heralds?",
    answer:
      "They are active, passionate members of the community who help push Uprix major impactful events to reach more people through publicizing them. They keep the community's culture of growth alive.",
  },
  {
    icon: Headset,
    iconColor: "text-cyan-500",
    question: "Who will I be interacting with?",
    answer:
      "You will step into a supportive space surrounded by forward-thinking individuals and action-takers.",
  },
];

function AccordionItem({
  item,
  isOpen,
  onToggle,
  itemRef,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
  itemRef: (element: HTMLDivElement | null) => void;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const chevronRef = useRef<HTMLSpanElement | null>(null);
  const Icon = item.icon;

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    if (isOpen) {
      gsap.to(el, {
        height: el.scrollHeight,
        opacity: 1,
        duration: 0.5,
        ease: "power3.out",
      });
      gsap.to(chevronRef.current, {
        rotate: 180,
        duration: 0.4,
        ease: "power3.out",
      });
    } else {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.4,
        ease: "power3.inOut",
      });
      gsap.to(chevronRef.current, {
        rotate: 0,
        duration: 0.4,
        ease: "power3.out",
      });
    }
  }, [isOpen]);

  return (
    <div
      ref={itemRef}
      className="rounded-2xl transition-shadow duration-300"
      style={{ background: BG, boxShadow: isOpen ? PRESSED : RAISED }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: BG, boxShadow: RAISED_SM }}
        >
          <Icon size={17} className={item.iconColor} />
        </div>
        <span className="flex-1 text-[15px] font-heading font-semibold text-slate-700">
          {item.question}
        </span>
        <span
          ref={chevronRef}
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-blue-500"
          style={{ background: BG, boxShadow: RAISED_SM }}
        >
          <ChevronDown size={14} />
        </span>
      </button>

      <div
        ref={contentRef}
        className="overflow-hidden px-5"
        style={{ height: 0, opacity: 0 }}
      >
        <div
          className="mb-4 mt-1 rounded-xl px-4 py-3.5"
          style={{ background: BG, boxShadow: PRESSED }}
        >
          <p className="text-[13.5px] text-slate-500 leading-relaxed">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FaqAccordion() {
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
    <div className="min-h-screen w-full flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-secondary-blue mb-2">
            Frequently asked questions
          </h2>
          <p className="text-sm text-slate-400">
            Everything you need to know before getting started.
          </p>
        </div>

        <div className="space-y-5">
          {ITEMS.map((item, i) => (
            <AccordionItem
              key={item.question}
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
    </div>
  );
}
