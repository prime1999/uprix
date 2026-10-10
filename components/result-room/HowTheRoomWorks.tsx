"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Eye, ShieldAlert, Target, type LucideIcon } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Content                                                                   */
/* -------------------------------------------------------------------------- */

const STEPS: {
  n: string;
  label: string;
  icon: LucideIcon;
  title: string;
  body: string;
}[] = [
  {
    n: "01",
    label: "Goal",
    icon: Target,
    title: "Pick one thing. Then give it 90 days.",
    body: "One clear result that actually matters to you. You leave with a clear execution system.",
  },
  {
    n: "02",
    label: "Partner",
    icon: Eye,
    title: "Someone will notice when you don't show up.",
    body: "For the full 90 days, you're paired 1-on-1. You track progress, report the work, and check in.",
  },
];

// ordered from mild to severe, so the colours escalate
const RULES = [
  { figure: "5", text: "Xcuse Slots", tone: "text-yellow-300" },
  { figure: "₦500", text: "penalty after slots", tone: "text-amber-400" },
  { figure: "5 days", text: "no-show = out", tone: "text-red-400" },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const [ref, shown] = useInView<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** 3D yellow tile: gradient, glossy highlight, soft glow, no dark bottom edge. */
function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-yellow-300/80 bg-gradient-to-b from-yellow-200 via-yellow-300 to-yellow-400 text-amber-950 shadow-[inset_0_2px_0_rgba(255,255,255,0.75),0_10px_20px_-6px_rgba(250,204,21,0.55)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transition-none">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-1.5 top-0.5 h-1/2 rounded-xl bg-gradient-to-b from-white/60 to-transparent"
      />
      <Icon className="relative size-6" />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Rules card (dark, so it reads as the serious one)                         */
/* -------------------------------------------------------------------------- */

function RulesCard() {
  const [ref, shown] = useInView<HTMLElement>(0.3);

  return (
    <article
      id="rules"
      ref={ref}
      className="group relative h-full overflow-hidden rounded-3xl border border-neutral-700 bg-gradient-to-b from-neutral-800 to-neutral-950 p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_50px_-16px_rgba(0,0,0,0.55)] transition-transform duration-300 hover:-translate-y-1.5 motion-reduce:transition-none md:p-7"
    >
      {/* top sheen */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent"
      />

      <div className="relative flex items-start justify-between">
        <IconTile icon={ShieldAlert} />
        <span className="select-none font-heading text-5xl font-black leading-none text-white/10">
          03
        </span>
      </div>

      <span className="relative mt-6 block font-mono text-xs tracking-[0.02em] text-yellow-300">
        03 · Rules
      </span>
      <h3 className="relative mt-2 text-xl font-bold leading-snug">
        This room has rules.
      </h3>

      <ul className="relative mt-6">
        {RULES.map((rule, i) => (
          <li
            key={rule.text}
            className={`flex items-center gap-4 border-b border-white/10 py-3.5 transition-all duration-500 first:pt-0 last:border-0 last:pb-0 motion-reduce:transition-none ${
              shown ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
            }`}
            style={{ transitionDelay: `${300 + i * 150}ms` }}
          >
            <span
              className={`min-w-[5.5rem] font-heading text-2xl font-extrabold tabular-nums ${rule.tone}`}
            >
              {rule.figure}
            </span>
            <span className="text-sm leading-snug text-white/70">
              {rule.text}
            </span>
          </li>
        ))}
      </ul>

      {/* escalation bar: mild to severe */}
      <div className="relative mt-6 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full origin-left rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-red-500 transition-transform duration-[1400ms] ease-out motion-reduce:transition-none"
          style={{
            transform: shown ? "scaleX(1)" : "scaleX(0)",
            transitionDelay: "500ms",
          }}
        />
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section                                                                   */
/* -------------------------------------------------------------------------- */

export default function HowTheRoomWorks() {
  const [headRef, headShown] = useInView<HTMLDivElement>(0.4);
  const [gridRef, gridShown] = useInView<HTMLDivElement>(0.25);

  return (
    <section
      id="how"
      className="relative isolate overflow-hidden bg-gradient-to-b from-yellow-50 via-yellow-100 to-amber-100 py-[clamp(70px,10vw,130px)]"
    >
      {/* background: faint dots + soft glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute bg-yellow-100 inset-0" />
        <div className="absolute -left-24 top-10 size-[26rem] rounded-full bg-yellow-300/50 blur-3xl" />
        <div className="absolute -right-20 bottom-0 size-[24rem] rounded-full bg-amber-300/40 blur-3xl" />
      </div>

      <div className="mx-auto w-[calc(100%-44px)] max-w-[1120px]">
        {/* header */}
        <div ref={headRef}>
          <Reveal>
            <span className="rr-figure rr-mono font-mono text-sm tracking-widest text-gray-800 font-semibold">
              How the room works
            </span>
            <h2 className="mt-5 text-6xl font-bold font-bricolage text-secondary-blue leading-[1.05] tracking-tight text-neutral-950 md:text-6xl">
              Structure that <br />
              <span className="relative inline-block">
                <span
                  aria-hidden
                  className="absolute inset-x-[-4px] bottom-1 z-0 h-3.5 origin-left -skew-x-6 rounded-sm bg-primary-yellow transition-transform duration-700 ease-out motion-reduce:transition-none md:h-5"
                  style={{
                    transform: headShown ? "scaleX(1)" : "scaleX(0)",
                    transitionDelay: "400ms",
                  }}
                />
                <span className="relative z-10 font-bricolage">
                  doesn&apos;t negotiate.
                </span>
              </span>
            </h2>
          </Reveal>
        </div>

        {/* cards */}
        <div ref={gridRef} className="relative mt-12 md:mt-16">
          {/* dashed line linking the three steps (desktop) */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-[3.25rem] hidden md:block"
          >
            <div
              className="h-0 border-t-2 border-dashed border-amber-500/60 transition-[width] duration-[1600ms] ease-out motion-reduce:transition-none"
              style={{ width: gridShown ? "100%" : "0%" }}
            />
          </div>

          <div className="relative grid grid-cols-1 gap-6 text-left md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 130} className="relative z-10">
                <article className="group relative h-full overflow-hidden rounded-3xl border border-white/80 bg-white/60 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_40px_-16px_rgba(180,120,0,0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/75 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_24px_50px_-16px_rgba(180,120,0,0.45)] motion-reduce:transition-none md:p-7">
                  {/* light sweep on hover */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-white/50 transition-transform duration-700 group-hover:translate-x-[420%]"
                  />

                  <div className="relative flex items-start justify-between">
                    <IconTile icon={step.icon} />
                    <span className="select-none font-heading text-5xl font-black leading-none text-neutral-900/10">
                      {step.n}
                    </span>
                  </div>

                  <span className="relative mt-6 block font-mono text-xs tracking-[0.02em] text-neutral-600">
                    {step.n} · {step.label}
                  </span>
                  <h3 className="relative mt-2 text-xl font-bold leading-snug text-neutral-950">
                    {step.title}
                  </h3>
                  <p className="relative mt-3 text-sm leading-relaxed text-neutral-600">
                    {step.body}
                  </p>
                </article>
              </Reveal>
            ))}

            <Reveal delay={260} className="relative z-10">
              <RulesCard />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
