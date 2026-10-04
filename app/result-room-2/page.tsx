"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, CheckCircle2, Calendar, Users } from "lucide-react";
import logo from "@/app/assets/images/logo.png";
import mobileLogo from "@/app/assets/images/mobileLogo.png";
import trophy from "@/app/assets/images/handTrophy.png";
import TextMarquee from "@/components/result-room/MarqueeText";
import MechanismsSectionAnimated from "@/components/result-room/Mechanism";

export default function ResultRoom2Page() {
  const checkoutUrl = "/payment";

  const INK = "#1C2B20";
  const GREEN = "#A8D86A";

  const PILLARS = [
    {
      title: "Structure",
      body: "A clear 90-day path, so you always know the next move.",
    },
    {
      title: "Accountability",
      body: "Real people watching the work, so skipping isn’t invisible.",
    },
    {
      title: "Consequences",
      body: "Missing a day costs you something, so showing up matters.",
    },
  ];

  // Marker-style underline that follows the text across line breaks
  function Highlight({ children }: { children: ReactNode }) {
    return (
      <span
        className="box-decoration-clone"
        style={{
          backgroundImage: `linear-gradient(to top, #ffdd00 0.13em, transparent 0.13em)`,
        }}
      >
        {children}
      </span>
    );
  }

  function Dot() {
    return (
      <span
        className="block size-2 rounded-full ring-4"
        style={{
          backgroundColor: "#ffdd00",
          ["--tw-ring-color" as string]: "rgba(255,221,0,0.3)",
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen text-slate-900 font-body selection:bg-primary-yellow selection:text-slate-950 overflow-x-hidden">
      {/* Self-contained CSS animation for the slow moving banner */}
      <style jsx global>{`
        @keyframes rrMarquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .rr-ticker {
          display: flex;
          width: max-content;
          animation: rrMarquee 28s linear infinite;
        }
        .rr-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Floating Pill Navigation */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4">
        <nav className="mx-auto flex h-12 max-w-8/12 items-center justify-between rounded-md border p-2 backdrop-blur-xl md:w-6/12">
          <div className="flex items-center gap-3">
            {/* <span className="font-heading font-black text-xl text-[#0D1322] tracking-tight">
              Upri<span className="text-secondary-blue">x</span>
            </span> */}
            <Image
              src={logo}
              alt="Logo"
              width={130}
              height={130}
              className="hidden object-cover lg:block"
            />
            <Image
              src={mobileLogo}
              alt="Mobile Logo"
              width={40}
              height={40}
              className="object-cover lg:hidden"
            />
          </div>

          <Link
            href={checkoutUrl}
            className="inline-flex items-center gap-2 rounded-md bg-primary-blue hover:brightness-95 text-white font-bold p-2 text-xs sm:text-sm transition-all shadow-sm"
          >
            <span>Save my seat</span>
            <span className="w-5 h-5 rounded-sm bg-primary-yellow text-primary-blue flex items-center justify-center">
              <ArrowUpRight size={13} />
            </span>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 px-4 pr-0 lg:pr-0 mx-auto overflow-x-clip">
        <h1 className="absolute top-5 left-10 text-center font-extrabold text-[180px] text-gray-300 -z-30 pointer-events-none select-none">
          RESULT ROOM
        </h1>

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mt-16 z-50 ml-4 md:ml-8 lg:ml-24">
          <span className="w-2 h-2 rounded-full bg-primary-yellow inline-block animate-pulse" />
          <span>COHORT 2.0</span>
          <span className="text-slate-300">•</span>
          <span className="text-secondary-blue font-extrabold">
            ONE GOAL. 90 DAYS. NO HIDING.
          </span>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 ml-4 md:ml-8 lg:ml-24">
            <h1 className="font-heading font-black text-4xl sm:text-6xl md:text-7xl text-[#0D1322] tracking-tight leading-[1.05] uppercase mb-6">
              90 days from now, you’ll either have the result... <br />
              <span className="bg-primary-yellow text-slate-950 px-2.5 py-0.5 inline-block mt-1 rounded-lg tracking-widest">
                or another explanation.
              </span>
            </h1>

            <p className="text-lg text-slate-700 max-w-xl leading-relaxed mb-4 font-medium">
              You already know what you want. The business. The skill. The
              grades. The project. The body of work. The version of yourself you
              keep saying you're becoming.
            </p>

            <p className="text-xs text-slate-500 max-w-lg mb-8">
              You don’t need another goal. You need an environment that makes it
              harder to keep abandoning the one you already have.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
              <Link
                href={checkoutUrl}
                className="inline-flex items-center gap-2 rounded-md bg-primary-blue hover:brightness-95 text-white font-bold p-2 text-xs sm:text-sm transition-all shadow-sm"
              >
                <span>Save my seat</span>
                <span className="w-5 h-5 rounded-sm bg-primary-yellow text-primary-blue flex items-center justify-center">
                  <ArrowUpRight size={13} />
                </span>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-secondary-blue" />
                Oct 18, 2026 – Jan 16, 2027
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Users size={14} className="text-secondary-blue" />
                Only 50 seats available
              </span>
              <span>•</span>
              <span className="text-rose-600 font-bold">
                Deadline: Oct 8, 8:00 PM
              </span>
            </div>
          </div>

          {/* Trophy container extending past right margin */}
          <div className="relative lg:col-span-5 -mr-4 sm:-mr-8 md:-mr-12 lg:-mr-24 pointer-events-none">
            <div className="absolute inset-0 hidden lg:block">
              <div className="absolute -left-10 top-10 h-28 w-28 rounded-full bg-primary-yellow/25 blur-3xl" />
              <div className="absolute right-0 bottom-4 h-24 w-24 rounded-full bg-secondary-blue/20 blur-3xl" />
            </div>

            <div className="relative z-10 flex items-center justify-end">
              <Image
                src={trophy}
                alt="Hand Trophy"
                width={620}
                height={620}
                priority
                className="h-auto w-[360px] sm:w-[480px] lg:w-[560px] max-w-none object-contain drop-shadow-[0_25px_45px_rgba(15,23,42,0.18)] translate-x-10 sm:translate-x-16 lg:translate-x-20 lg:translate-y-4"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Self-contained Smooth Infinite Marquee Banner */}

      <TextMarquee />

      {/* Section 01: The Pattern */}
      <section className="px-5 py-24 sm:px-10 sm:py-32">
        <div className="mx-auto max-w-6xl">
          {/* Eyebrow */}
          <div className="mb-8 flex items-center gap-3 text-xs">
            <Dot />
            <span className="tracking-wide text-[#8A8A82]">
              01 · The Pattern
            </span>
          </div>

          {/* Big statement */}
          <p className="max-w-4xl text-3xl font-normal leading-[1.15] tracking-tight sm:text-5xl font-heading">
            <Highlight>You&apos;ve said it before.</Highlight>{" "}
            <span className="text-[#8A8A82]">
              “I’ll start next month.” “I’ll be more consistent.” “I’ll get
              serious soon.” “This time, I’ll actually stick with it.”
            </span>{" "}
            And you probably meant it. But life happened, and{" "}
            <Highlight>another month disappeared</Highlight> without the result.
          </p>

          {/* Pivot line */}
          <p className="mt-12 max-w-2xl text-base leading-relaxed text-[#8A8A82] sm:text-lg">
            <span style={{ color: INK }}>
              That’s the cycle The Result Room was built to interrupt.
            </span>{" "}
            Not with another motivational speech, another productivity PDF, or
            another group where everybody disappears after week two.
          </p>

          {/* Three pillars */}
          <div className="mt-20 grid gap-10 md:grid-cols-3 md:gap-8">
            {PILLARS.map((p, i) => (
              <div key={p.title} className="border-t border-[#D9D4CA] pt-6">
                <div className="flex items-center gap-3 text-xs text-[#8A8A82]">
                  <Dot />
                  <span>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-8 text-xl font-medium tracking-tight">
                  {p.title}
                </h3>
                <p className="mt-3 max-w-[17rem] text-sm leading-relaxed text-[#8A8A82]">
                  {p.body}
                </p>
              </div>
            ))}
          </div>

          {/* Closing line */}
          <div className="mt-14 flex items-center gap-3 border-t border-[#D9D4CA] pt-6 text-lg sm:text-2xl">
            <Dot />
            <p className="font-normal tracking-tight">
              And <Highlight>90 days</Highlight> where one result becomes the
              priority.
            </p>
          </div>
        </div>
      </section>

      {/* Section 02: The Mechanisms */}
      <MechanismsSectionAnimated />

      {/* Section 03: Rules of The Room */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          <span className="text-secondary-blue font-extrabold">03</span>
          <span>The Rules</span>
        </div>
        <h2 className="font-heading font-black text-3xl sm:text-5xl text-[#0D1322] tracking-tight uppercase mb-2">
          This Room Has Rules.
        </h2>
        <p className="text-slate-500 text-sm mb-12">
          Because “do your best” is too easy to negotiate with.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
            <span className="font-heading font-black text-4xl text-slate-950 block mb-2">
              05
            </span>
            <h4 className="font-heading font-black text-base text-[#0D1322] mb-2 uppercase">
              Xcuse Slots
            </h4>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Life happens. Emergencies happen. You get exactly five excuse
              slots for the entire 90 days. Use them wisely.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
            <span className="font-heading font-black text-4xl text-rose-600 block mb-2">
              ₦500
            </span>
            <h4 className="font-heading font-black text-base text-[#0D1322] mb-2 uppercase">
              Missed Penalty
            </h4>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Run out of excuses? Every missed daily task afterwards attracts a
              ₦500 penalty.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
            <span className="font-heading font-black text-4xl text-red-600 block mb-2">
              OUT
            </span>
            <h4 className="font-heading font-black text-base text-[#0D1322] mb-2 uppercase">
              5 Days No-Show
            </h4>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Five unexplained days without showing up means eviction. A room
              built around results cannot normalize disappearing.
            </p>
          </div>
        </div>
      </section>

      {/* Section 04: Filter / Qualification */}
      <section className="py-20 px-4 max-w-3xl mx-auto text-center border-t border-slate-200">
        <h3 className="font-heading font-black text-2xl sm:text-4xl text-[#0D1322] uppercase mb-4">
          This is not for everyone.
        </h3>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
          If you want a casual community, a motivational group, another place to
          read inspiring messages, or a system with no consequences:{" "}
          <strong className="text-rose-600">Don’t enter. Seriously.</strong>
        </p>
        <p className="text-slate-900 text-sm sm:text-base font-semibold leading-relaxed">
          But if there’s one thing you’re tired of carrying from month to
          month... one result you’ve delayed long enough... one area where you
          know you’ve been capable of more... then keep reading.
        </p>
      </section>

      {/* Section 05: The Offer Stack Card */}
      <section className="py-20 px-4 bg-[#FAF9F5] border-t border-slate-200">
        <div className="max-w-2xl mx-auto bg-white border border-slate-300 shadow-xl rounded-3xl p-7 sm:p-10 relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
            All-Inclusive Cohort
          </div>

          <div className="text-center pb-8 border-b border-slate-200 mt-2">
            <h3 className="font-heading font-black text-3xl sm:text-4xl text-[#0D1322] uppercase tracking-tight mb-1">
              Result Room 2.0
            </h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              October 18, 2026 – January 16, 2027
            </p>

            <div className="mt-6 flex items-baseline justify-center gap-1">
              <span className="font-heading font-black text-5xl text-[#0D1322]">
                ₦10,600
              </span>
              <span className="text-slate-500 text-sm font-medium">
                / 90 days
              </span>
            </div>

            <p className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-full inline-block">
              Lock in with a minimum ₦5,000 deposit and balance up later
            </p>
          </div>

          <div className="py-8 space-y-4 text-xs sm:text-sm">
            {[
              {
                title: "1-on-1 Goal Consultation with Taifaq",
                val: "₦8,500 value",
              },
              {
                title: "1-on-1 Accountability Partner for 90 Days",
                val: "Core System",
              },
              {
                title: "The Result Room Daily Tracking & Execution Hub",
                val: "Core Environment",
              },
              {
                title: "All Result Conversations & Strategy Frameworks",
                val: "₦15,000 value",
              },
              {
                title:
                  "The Accountability System (Xcuse Slots, Penalties, Eviction)",
                val: "Zero Disappearing",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2
                    size={16}
                    className="text-secondary-blue shrink-0"
                  />
                  <span className="font-medium">{item.title}</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap hidden sm:inline">
                  {item.val}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <Link
              href={checkoutUrl}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-yellow hover:brightness-95 text-slate-950 font-heading font-black text-base py-4 shadow-md transition-all hover:scale-[1.01]"
            >
              <span>SECURE MY SPOT NOW</span>
              <span className="w-6 h-6 rounded-full bg-slate-950 text-white flex items-center justify-center">
                <ArrowUpRight size={15} />
              </span>
            </Link>
            <p className="mt-3 text-xs text-slate-500 font-medium">
              Only 50 seats available • Deadline: October 8 (8:00 PM)
            </p>
          </div>
        </div>
      </section>

      {/* Section 06: Full Bleed Yellow Finale */}
      <section className="bg-primary-yellow py-24 px-4 text-slate-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs font-black uppercase tracking-wider text-slate-800 mb-4">
            06 THE INVITATION • ONE LAST QUESTION
          </div>

          <h2 className="font-heading font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight leading-[1.05] mb-8 text-[#0D1322]">
            Are you tired of confusing effort with progress?
          </h2>

          <p className="text-base sm:text-xl font-medium text-slate-800 max-w-2xl leading-relaxed mb-10">
            January 16 is coming anyway. You'll either arrive with another
            promise, another restart, and another explanation... or evidence.
          </p>

          <Link
            href={checkoutUrl}
            className="inline-flex items-center gap-3 rounded-full bg-[#0D1322] hover:bg-slate-800 text-white font-heading font-bold text-sm sm:text-base px-8 py-4 transition-all shadow-xl hover:scale-105"
          >
            <span>Reserve my seat</span>
            <span className="w-6 h-6 rounded-full bg-primary-yellow text-slate-950 flex items-center justify-center">
              <ArrowUpRight size={15} />
            </span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-base text-slate-900 tracking-tight">
              Uprix
            </span>
            <span>• The Result Room 2.0</span>
          </div>
          <div>Direction. Execution. Results.</div>
        </div>
      </footer>
    </div>
  );
}
