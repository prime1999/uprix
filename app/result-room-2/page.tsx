"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Users,
} from "lucide-react";

export default function ResultRoom2Page() {
  const checkoutUrl = "/payment";

  const marqueeItems = [
    "SHOW UP EVERY DAY",
    "ONE GOAL",
    "90 DAYS",
    "NO HIDING",
    "CONSEQUENCES MATTER",
    "EXECUTION OVER MOTIVATION",
    "EVIDENCE OVER EXPLANATIONS",
    "ZERO GHOSTING",
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-slate-900 font-body selection:bg-primary-yellow selection:text-slate-950 overflow-x-hidden">
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
        <nav className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-sm rounded-full px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-heading font-black text-xl text-[#0D1322] tracking-tight">
              Upri<span className="text-secondary-blue">x</span>
            </span>
            <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-wider text-slate-400 border-l border-slate-200 pl-3">
              The Result Room 2.0
            </span>
          </div>

          <Link
            href={checkoutUrl}
            className="inline-flex items-center gap-2 rounded-full bg-primary-yellow hover:brightness-95 text-slate-950 font-bold px-4 py-2 text-xs sm:text-sm transition-all shadow-sm"
          >
            <span>Save my seat</span>
            <span className="w-5 h-5 rounded-full bg-slate-950 text-white flex items-center justify-center">
              <ArrowUpRight size={13} />
            </span>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">
          <span className="w-2 h-2 rounded-full bg-primary-yellow inline-block animate-pulse" />
          <span>COHORT 2.0</span>
          <span className="text-slate-300">•</span>
          <span className="text-secondary-blue font-extrabold">
            ONE GOAL. 90 DAYS. NO HIDING.
          </span>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-8">
            <h1 className="font-heading font-black text-4xl sm:text-6xl md:text-7xl text-[#0D1322] tracking-tight leading-[1.05] uppercase mb-6">
              90 days from now, you’ll either have the result... <br />
              <span className="bg-primary-yellow text-slate-950 px-2.5 py-0.5 inline-block mt-1">
                or another explanation.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-700 max-w-xl leading-relaxed mb-4 font-medium">
              You already know what you want. The business. The skill. The grades.
              The project. The body of work. The version of yourself you keep
              saying you're becoming.
            </p>

            <p className="text-sm sm:text-base text-slate-500 max-w-lg mb-8">
              You don’t need another goal. You need an environment that makes it
              harder to keep abandoning the one you already have.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
              <Link
                href={checkoutUrl}
                className="inline-flex items-center gap-3 rounded-full bg-primary-yellow hover:brightness-95 text-slate-950 font-bold px-7 py-3.5 text-sm sm:text-base shadow-md transition-transform hover:scale-[1.02]"
              >
                <span>ENTER THE RESULT ROOM</span>
                <span className="w-6 h-6 rounded-full bg-slate-950 text-white flex items-center justify-center">
                  <ArrowUpRight size={15} />
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

          {/* Quick Target Board Card */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="w-full max-w-xs bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xl space-y-5 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFF9E6] border border-primary-yellow/50 flex items-center justify-center text-3xl shadow-sm">
                🎯
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
                  Target Outcome
                </p>
                <h3 className="font-heading font-extrabold text-2xl text-[#0D1322] mt-0.5">
                  1 Priority Result
                </h3>
              </div>
              <div className="bg-[#FAF9F5] rounded-2xl p-4 text-left text-xs space-y-2.5 border border-slate-100 font-medium">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Execution Window</span>
                  <span className="font-bold text-slate-950">90 Days</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Emergency Excuse</span>
                  <span className="font-bold text-slate-950">5 Slots</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Ghosting Rule</span>
                  <span className="font-bold text-rose-600">Eviction</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Self-contained Smooth Infinite Marquee Banner */}
      <div className="border-y border-slate-200 bg-white py-3.5 overflow-hidden">
        <div className="rr-ticker items-center gap-8 text-xs sm:text-sm font-heading font-black tracking-widest text-slate-400 uppercase select-none">
          {marqueeItems.concat(marqueeItems).map((text, idx) => (
            <div key={idx} className="flex items-center gap-8 shrink-0">
              <span className="hover:text-slate-950 transition-colors">{text}</span>
              <span className="text-primary-yellow font-black">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 01: The Pattern */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          <span className="text-secondary-blue font-extrabold">01</span>
          <span>The Pattern</span>
        </div>
        <h2 className="font-heading font-black text-3xl sm:text-5xl text-[#0D1322] tracking-tight uppercase mb-8">
          You've said it before.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {[
            "“I’ll start next month.”",
            "“I’ll be more consistent.”",
            "“I’ll get serious soon.”",
            "“This time, I’ll actually stick with it.”",
          ].map((quote, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 font-semibold text-slate-800 text-center shadow-sm text-sm sm:text-base"
            >
              {quote}
            </div>
          ))}
        </div>

        <div className="bg-[#FAF9F5] border border-slate-200 rounded-3xl p-6 sm:p-9 space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed">
          <p>
            And you probably meant it. But then life happened. Motivation dropped.
            You missed one day. Then another. And somehow... another month
            disappeared without the result.
          </p>
          <p className="font-bold text-slate-950 text-base sm:text-lg">
            That’s the cycle The Result Room was built to interrupt.
          </p>
          <p className="text-slate-600">
            Not with another motivational speech. Not with another productivity PDF.
            Not with another group where everybody disappears after week two.
          </p>
          <div className="pt-2 font-heading font-black text-base sm:text-xl text-secondary-blue">
            With structure. Accountability. Consequences. And 90 days where one
            result becomes the priority.
          </div>
        </div>
      </section>

      {/* Section 02: The Mechanisms */}
      <section className="py-20 px-4 bg-[#FAF9F5] border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <span className="text-secondary-blue font-extrabold">02</span>
            <span>The Mechanisms</span>
          </div>
          <h2 className="font-heading font-black text-3xl sm:text-5xl text-[#0D1322] tracking-tight uppercase mb-4">
            Why this room is completely different.
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mb-12">
            The problem isn't that you don't want it badly enough. The problem is
            that when motivation disappears, most systems have no friction.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Mechanism 01 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-7 sm:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-secondary-blue bg-blue-50 px-3 py-1 rounded-full">
                  Mechanism 01
                </span>
                <h3 className="font-heading font-black text-2xl text-[#0D1322] mt-4 mb-3 uppercase">
                  Pick One Thing. Then Give It 90 Days.
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Not seven goals. Not “I just want to improve myself.” One clear
                  result that actually matters to you.
                </p>
                <div className="bg-[#FDFCF7] border border-slate-200 rounded-2xl p-5 space-y-2.5 text-xs sm:text-sm mb-6">
                  <p className="font-bold text-slate-900">
                    Goal Consultation with Taifaq:
                  </p>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                      What exactly are you trying to achieve?
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                      What actions actually move you there?
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                      A clear, daily 90-day execution system
                    </li>
                  </ul>
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-400 italic">
                You leave that conversation with zero guessing. You know the result,
                you know the work, then you execute.
              </p>
            </div>

            {/* Mechanism 02 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-7 sm:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-secondary-blue bg-blue-50 px-3 py-1 rounded-full">
                  Mechanism 02
                </span>
                <h3 className="font-heading font-black text-2xl text-[#0D1322] mt-4 mb-3 uppercase">
                  Someone Will Notice When You Don’t Show Up.
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Most accountability systems depend solely on you. When you skip
                  or disappear, nobody notices. In Result Room, disappearing has
                  friction.
                </p>
                <div className="bg-[#FDFCF7] border border-slate-200 rounded-2xl p-5 space-y-2.5 text-xs sm:text-sm mb-6">
                  <p className="font-bold text-slate-900">
                    Your 1-on-1 Accountability Partner:
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    Paired with one person inside the room for the full 90 days.
                    You track progress together, report the work, and ensure
                    neither of you slips into hiding.
                  </p>
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-400 italic">
                You don’t need another lesson on discipline. You need to know that
                disappearing will be noticed.
              </p>
            </div>
          </div>
        </div>
      </section>

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
              Life happens. Emergencies happen. You get exactly five excuse slots
              for the entire 90 days. Use them wisely.
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
              <span className="text-slate-500 text-sm font-medium">/ 90 days</span>
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
                title: "The Accountability System (Xcuse Slots, Penalties, Eviction)",
                val: "Zero Disappearing",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 text-slate-800">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-secondary-blue shrink-0" />
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