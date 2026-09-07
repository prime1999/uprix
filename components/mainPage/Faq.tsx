"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    question: "What exactly is Uprix?",
    answer:
      "Uprix is a growth-driven community where you learn and take action that will help you grow every single day.",
  },
  {
    question: "What regular activities happen in the community?",
    answer:
      "We have daily affirmations to build a winning mindset, bi-monthly Game Nights to unwind and win cash prizes, and X-Deep, a monthly virtual eye-opening masterclass within the community.",
  },
  {
    question: "What is the X-Growth Vault?",
    answer:
      "It is a complete digital resource ecosystem packed with practical knowledge and guides on personal development, digital skills, business growth and more.",
  },
  {
    question: "Can Uprix help me promote my business?",
    answer:
      "Yes. Through our Uprixtunity platform, you can put your brand on the Spotlight. We give you a stage to showcase your business and skills to a wider audience.",
  },
  {
    question: "Who is Uprix built for?",
    answer:
      "It is for anyone who is willing to grow, learn practical skills, and get the accountability they need to achieve their goals.",
  },
  {
    question: "Who are the Uprix Heralds?",
    answer:
      "They are active, passionate members of the community who help push Uprix major impactful events to reach more people through publicizing them. They keep the community's culture of growth alive.",
  },
  {
    question: "Who will I be interacting with?",
    answer:
      "You will step into a supportive space surrounded by forward-thinking individuals and action-takers.",
  },
];

export default function Faq() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.from(".faq-heading", {
        y: 28,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
      });

      gsap.from(".faq-item", {
        y: 22,
        opacity: 0,
        duration: 0.55,
        stagger: 0.08,
        delay: 0.15,
        ease: "power3.out",
      });
    }, sectionRef);

    return () => context.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="w-full overflow-hidden bg-background px-4 py-20 font-body sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="faq-heading self-start lg:sticky lg:top-24">
          <span className="inline-block rounded-full border border-primary-blue/20 bg-primary-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-blue">
            FAQ
          </span>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
            Everything you need to know about Uprix.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
            Get familiar with the community, its activities, and the people you
            will grow alongside.
          </p>
        </div>

        <Accordion
          type="single"
          collapsible
          defaultValue="item-0"
          className="w-full"
        >
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem
              key={item.question}
              value={`item-${index}`}
              className="faq-item border-border/80 py-1"
            >
              <AccordionTrigger className="py-5 text-base font-semibold text-foreground hover:no-underline sm:text-lg">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="max-w-2xl pb-5 text-sm leading-7 text-muted-foreground sm:text-base">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
