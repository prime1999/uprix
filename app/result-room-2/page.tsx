"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { CircleArrowOutUpRight, CircleArrowOutDownRight } from "lucide-react";
import YellowButton from "@/components/miselleneous/yellowButton";
import WhiteButton from "@/components/miselleneous/whiteButton";
import TextSlider from "@/components/result-room/textSlider";
import RoomSection from "@/components/result-room/RoomSection";
import QualificationSection from "@/components/result-room/QualificationSection";
import OfferSection from "@/components/result-room/OfferSection";
import Footer from "@/components/result-room/Footer";
import BackToTop from "@/components/result-room/BackToTop";
import HowTheRoomWorks from "@/components/result-room/HowTheRoomWorks";
import TestimonialsSlider from "@/components/result-room/TestimonialsSlider";

gsap.registerPlugin(ScrollTrigger);

const deadline = Date.UTC(2026, 9, 8, 19, 0, 0);
const commitments = [
  "Being accountable.",
  "Being tracked.",
  "Showing up even when I do not feel like it.",
  "Focusing on one meaningful goal.",
  "Being challenged when I disappear.",
  "Having consequences when excuses run out.",
  "Giving myself 90 real days instead of another 90 days of soon.",
];

const faqs = [
  [
    "What is the Result Room?",
    "A 90-day execution and accountability experience built around one goal, a 1-on-1 accountability partner, and real consequences. Capacity is 50 people.",
  ],
  [
    "Who is it for?",
    "People with one result they have delayed long enough and who want structure, visibility, and consequences. It is not a casual community or a motivational group.",
  ],
  [
    "What happens if I miss a day?",
    "You get five Xcuse Slots for the full 90 days. After that, each missed daily task attracts a ₦500 penalty, and five unexplained no-show days means eviction.",
  ],
  [
    "How does payment work?",
    "The investment is ₦10,600. Secure your place with a minimum ₦5,000 deposit and complete the balance without extra charges.",
  ],
  [
    "Will I get a result?",
    "The room gives you structure, a partner, and consequences. The work, and the result, are yours.",
  ],
];

function AppPreview() {
  return (
    <div className="bg-white shadow-sm rr-app-preview rr-reveal grid min-h-[430px] text-left lg:grid-cols-[190px_1fr_250px]">
      <aside className="rr-sidebar">
        {["My goal", "Check-ins", "Partner", "Rules"].map((item, index) => (
          <div
            className={`rr-sidebar-item ${index === 0 ? "active" : ""}`}
            key={item}
          >
            <i />
            {item}
          </div>
        ))}
        <small>Cycle</small>
        <div className="rr-sidebar-item">
          <i />
          Oct 18 → Jan 16
        </div>
      </aside>
      <div className="rr-main-preview">
        <div className="rr-preview-header">
          <b>Cycle 1 · Day 23 / 90</b>
          <span>
            Progress{" "}
            <i className="rr-progress">
              <em />
            </i>
          </span>
        </div>
        {[
          "Design practice · 40 minutes",
          "Publish one draft video",
          "Report today's work to partner",
          "Plan tomorrow's task",
        ].map((task, index) => (
          <div className="rr-task-row" key={task}>
            <code>RR-10{index + 1}</code>
            <i
              className={`rr-status ${index < 2 ? "done" : index === 2 ? "progress" : "backlog"}`}
            />
            <span>{task}</span>
            <small>
              {index < 2 ? "Done" : index === 2 ? "In progress" : "Todo"}
            </small>
          </div>
        ))}
        <div className="rr-feed">
          <span className="rr-avatar yellow" /> Partner checked in{" "}
          <small>· 2m ago</small>
          <span className="rr-avatar" /> You reported today's work{" "}
          <small>· just now</small>
        </div>
      </div>
      <aside className="rr-properties">
        <small>Properties</small>
        <p>
          <span>Goal</span>
          <b>One result</b>
        </p>
        <p>
          <span>Partner</span>
          <b>1-on-1</b>
        </p>
        <p>
          <span>Xcuse slots</span>
          <b>● ● ○ ○ ○</b>
        </p>
        <p>
          <span>After slots</span>
          <b>₦500 / miss</b>
        </p>
        <p>
          <span>5 no-shows</span>
          <b className="red">Eviction</b>
        </p>
      </aside>
    </div>
  );
}

export default function ResultRoomTwoPage() {
  const page = useRef<HTMLDivElement>(null);
  const [remaining, setRemaining] = useState({
    hours: "--",
    minutes: "--",
    seconds: "--",
  });
  const [openFaq, setOpenFaq] = useState(0);
  const [openInclude, setOpenInclude] = useState(0);
  const [checked, setChecked] = useState<boolean[]>(() =>
    commitments.map(() => false),
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    name: "",
    phone: "",
    goal: "",
    plan: "",
  });

  useEffect(() => {
    const tick = () => {
      const difference = deadline - Date.now();
      if (difference <= 0)
        return setRemaining({ hours: "00", minutes: "00", seconds: "00" });
      setRemaining({
        hours: String(Math.floor(difference / 3600000)).padStart(2, "0"),
        minutes: String(Math.floor((difference % 3600000) / 60000)).padStart(
          2,
          "0",
        ),
        seconds: String(Math.floor((difference % 60000) / 1000)).padStart(
          2,
          "0",
        ),
      });
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useGSAP(
    () => {
      gsap.fromTo(
        ".rr-reveal",
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: { trigger: ".rr-page", start: "top 85%" },
        },
      );
      gsap.utils
        .toArray<HTMLElement>(".rr-section .rr-reveal")
        .forEach((element) =>
          gsap.fromTo(
            element,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              ease: "power3.out",
              scrollTrigger: { trigger: element, start: "top 88%", once: true },
            },
          ),
        );
      gsap.to(".rr-glow", {
        scale: 1.08,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: page },
  );

  const confirmed = checked.filter(Boolean).length;
  const modalQuestions = [
    "First, what should we call you?",
    "What's your WhatsApp number?",
    "What's the one goal you'll give 90 days?",
  ];
  const modalKeys = ["name", "phone", "goal"] as const;
  // const continueModal = () => {
  //   if (step < 3 && !answers[modalKeys[step]]) return;
  //   setStep((current) => current + 1);
  // };

  return (
    <div
      className="rr-page min-h-screen overflow-clip font-body leading-[1.6] text-[#15151a]"
      ref={page}
    >
      <div className="rr-announcement bg-[#15151a] px-3.5 py-2 text-center text-[0.84rem] text-white">
        Payment closes today at 8:00 PM · closes in{" "}
        <b className="tabular-nums text-[#ffd60a]">
          {remaining.hours}:{remaining.minutes}:{remaining.seconds}
        </b>{" "}
        · Only 50 seats
      </div>
      <nav className="w-11/12 lg:w-8/12 mx-auto sticky top-3 z-10 rounded-full border-b border-[#e6e3da]/80 backdrop-blur-3xl">
        <div className="rr-wrap mx-auto flex h-16 w-[calc(100%-44px)] max-w-[1120px] items-center justify-between gap-3.5">
          <Link className="rr-logo" href="#top">
            <b />
            Result Room
          </Link>
          <div className="rr-links flex gap-7 text-[0.94rem] text-[#585862] max-[820px]:hidden">
            <Link
              href="#how"
              className="text-sm duration-500 transition hover:text-black/50"
            >
              How it works
            </Link>
            <Link
              href="#rules"
              className="text-sm duration-500 transition hover:text-black/50"
            >
              Rules
            </Link>
            <Link
              href="#offer"
              className="text-sm duration-500 transition hover:text-black/50"
            >
              Offer
            </Link>
            <Link
              href="#faq"
              className="text-sm duration-500 transition hover:text-black/50"
            >
              FAQ
            </Link>
          </div>
          <YellowButton>
            <span className="flex gap-2 items-center">
              {" "}
              Secure my spot
              <CircleArrowOutUpRight className="size-4 ml-1" />
            </span>
          </YellowButton>
        </div>
      </nav>

      <main id="top">
        <header className="mt-24">
          <div className="rr-glow" />
          <div className="relative mx-auto w-[calc(100%-44px)] max-w-[1120px] text-center">
            <Link
              className="bg-white rounded-full p-3 shadow-sm text-sm"
              href="#offer"
            >
              <b className="bg-primary-yellow rounded-full px-2 py-1">
                New cohort
              </b>{" "}
              Oct 18, 2026 → Jan 16, 2027
            </Link>
            <h1 className="w-full uppercase md:w-8/12 lg:w-7/12 mx-auto pt-8 text-[52px] lg:text-7xl lg:tracking-normal leading-[3.5rem] lg:leading-[4.8rem] font-bricolage">
              <span className="bg-primary-yellow py-1 px-4 rounded-xl font-bricolage">
                90 days
              </span>{" "}
              from now, you'll either have the result…
            </h1>
            <p className="rr-reveal">
              …or another explanation for why you still don't.
            </p>
            <p className="mx-auto w-full md:w-8/12 lg:w-7/12 mt-4 text-gray-700 text-center">
              You don't need another goal. You need an environment that makes it
              harder to keep abandoning the one you already have.
            </p>
            <div className="rr-actions  mt-[34px] flex flex-wrap justify-center gap-3">
              <YellowButton>
                <span className="flex gap-2 items-center">
                  {" "}
                  Enter the result room
                  <CircleArrowOutUpRight className="size-4 ml-1" />
                </span>
              </YellowButton>
              {/* <WhiteButton link="#rules">
                <span className="flex gap-2 items-center">
                  {" "}
                  See Rules
                  <CircleArrowOutDownRight className="size-4 ml-1" />
                </span>
              </WhiteButton> */}
            </div>
            <p className="rr-note ">
              <b>Start with a ₦5,000 deposit.</b> Balance later, no extra
              charges · 1 goal · 90 days · No hiding
            </p>
            <AppPreview />
            <small className="rr-mono font-mono text-xs tracking-[0.02em] text-[#585862]">
              Illustrative example of a Result Room cycle
            </small>
          </div>
        </header>

        <TextSlider />

        <RoomSection />

        <section className="rr-soft border-y border-[#e6e3da] bg-white py-[clamp(70px,10vw,130px)]">
          <div className="rr-wrap mx-auto w-[calc(100%-44px)] max-w-[1120px]">
            <span className="rr-figure rr-mono font-mono text-sm tracking-widest text-gray-800 font-semibold">
              The pattern
            </span>
            <div className="rr-split">
              <div>
                <h2 className="text-4xl">
                  You've said it <br />
                  before.
                </h2>
                <p className="text-sm my-4 leading-relaxed">
                  And you probably meant it. But then life happened. Motivation
                  dropped. You missed one day. Then another. And somehow…
                  another month disappeared without the result.
                </p>
                <p className="text-sm mb-8 leading-relaxed">
                  <b>
                    That's the cycle the Result Room was built to interrupt.
                  </b>{" "}
                  With structure, accountability, and consequences.
                </p>
                <YellowButton>
                  <span className="flex gap-2 items-center">
                    {" "}
                    I&apos;m done postponing
                    <CircleArrowOutUpRight className="size-4 ml-1" />
                  </span>
                </YellowButton>
              </div>
              <div className="rr-card rr-backlog ">
                <b>Your goals · Backlog</b>
                {[
                  "I'll start next month.",
                  "I'll be more consistent.",
                  "I'll get serious soon.",
                  "This time, I'll actually stick with it.",
                ].map((item) => (
                  <p key={item}>
                    <i className="rr-status backlog" />“{item}”{" "}
                    <small>Backlog</small>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
        <HowTheRoomWorks />

        <QualificationSection />
        <OfferSection deadline={deadline} onSecure={() => setModalOpen(true)} />

        <section className="rr-section rr-soft border-y border-[#e6e3da] bg-white py-[clamp(70px,10vw,130px)]">
          <div className="rr-wrap rr-center mx-auto w-[calc(100%-44px)] max-w-[1120px] text-center">
            <span className="rr-figure rr-mono font-mono text-xs tracking-relaxed text-gray-800 font-semibold">
              Commitment check
            </span>
            <h2 className="text-4xl">Before you join…</h2>
            <p className="text-sm text-gray-800">
              Understand what you're saying yes to. If it sounds like exactly
              what you've been missing, welcome. <br /> <br />{" "}
              <span className="font-semibold">
                Tap each one you’re genuinely ready to stand by for the next 90
                days.
              </span>
            </p>
            <div className="rr-checklist">
              {commitments.map((item, index) => (
                <button
                  className={checked[index] ? "selected" : ""}
                  key={item}
                  onClick={() =>
                    setChecked((current) =>
                      current.map((value, itemIndex) =>
                        itemIndex === index ? !value : value,
                      ),
                    )
                  }
                >
                  <i>✓</i>
                  {item}
                </button>
              ))}
            </div>
            <div className="rr-check-progress">
              <i
                style={{ width: `${(confirmed / commitments.length) * 100}%` }}
              />
            </div>
            <p className="rr-mono font-mono text-xs tracking-[0.02em] text-gray-800 font-semibold my-4">
              {confirmed} / 7 confirmed
            </p>
            <YellowButton
              disabled={confirmed !== 7}
              onClick={() => setModalOpen(true)}
            >
              <span className="flex items-center justify-center gap-2">
                {" "}
                I'm ready for the 90 days
                <CircleArrowOutUpRight className="size-4 ml-1" />
              </span>
            </YellowButton>
          </div>
        </section>
        <TestimonialsSlider />
        <section className="bg-white py-[clamp(70px,10vw,130px)]" id="faq">
          <div className="rr-wrap rr-narrow mx-auto w-[calc(100%-44px)] max-w-[860px]">
            <span className="rr-figure rr-mono font-mono text-xs tracking-[0.02em] text-gray-800 font-semibold">
              A little clarity
            </span>
            <h2 className="rr-reveal text-2xl">Good questions.</h2>
            {faqs.map(([question, answer], index) => (
              <div
                className={`rr-faq ${openFaq === index ? "open" : ""}`}
                key={question}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                >
                  <span>{question}</span>
                  <b>+</b>
                </button>
                {openFaq === index && <p>{answer}</p>}
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <BackToTop />
      {/* {modalOpen && (
        <div
          className="rr-modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setModalOpen(false)
          }
        >
          <div
            className="rr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rr-modal-title"
          >
            <button
              className="rr-modal-close"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <span className="rr-mono font-mono text-xs tracking-[0.02em] text-[#585862]">
              {step < 4 ? `STEP ${step + 1} OF 4` : "ALL SET"}
            </span>
            <div className="rr-check-progress">
              <i style={{ width: `${(Math.min(step, 4) / 4) * 100}%` }} />
            </div>
            {step < 3 ? (
              <>
                <h3 id="rr-modal-title">{modalQuestions[step]}</h3>
                <input
                  autoFocus
                  value={answers[modalKeys[step]]}
                  onChange={(event) =>
                    setAnswers({
                      ...answers,
                      [modalKeys[step]]: event.target.value,
                    })
                  }
                  placeholder={
                    step === 0
                      ? "First name"
                      : step === 1
                        ? "+234…"
                        : "e.g. Launch my design business"
                  }
                />
                <button className="rr-btn" onClick={continueModal}>
                  Continue
                  <Arrow />
                </button>
              </>
            ) : step === 3 ? (
              <>
                <h3 id="rr-modal-title">
                  How would you like to secure your seat?
                </h3>
                <button
                  className="rr-option"
                  onClick={() => {
                    setAnswers({
                      ...answers,
                      plan: "Deposit: ₦5,000 now, balance later",
                    });
                    setStep(4);
                  }}
                >
                  Deposit: ₦5,000 now, balance later
                </button>
                <button
                  className="rr-option"
                  onClick={() => {
                    setAnswers({ ...answers, plan: "Full payment: ₦10,600" });
                    setStep(4);
                  }}
                >
                  Full payment: ₦10,600
                </button>
              </>
            ) : (
              <>
                <h3 id="rr-modal-title">You're nearly in, {answers.name}.</h3>
                <p className="rr-lead">
                  Goal: {answers.goal} · {answers.plan}. Complete your payment
                  to lock your seat.
                </p>
                <ButtonLink href="#offer">Continue to payment</ButtonLink>
              </>
            )}
          </div>
        </div>
      )} */}
    </div>
  );
}
