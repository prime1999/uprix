"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

const INK = "#1C2B20";
const MUTED = "text-[#7C7C75]";

// Delay helper for staggering (used by the CSS below via --d)
const delay = (ms: number) =>
  ({ ["--d" as string]: `${ms}ms` }) as CSSProperties;

/* ---------- Animation CSS (core Tailwind has no custom keyframes) ---------- */
const ANIMATION_CSS = `
.rv   { opacity: 0; transform: translateY(26px); transition: opacity .8s ease var(--d,0ms), transform .8s cubic-bezier(.2,.7,.2,1) var(--d,0ms); }
.pop  { opacity: 0; transform: scale(.4); transition: opacity .5s ease var(--d,0ms), transform .6s cubic-bezier(.3,1.6,.5,1) var(--d,0ms); }
.dot  { transform: scale(0); transition: transform .45s cubic-bezier(.3,1.6,.5,1) calc(var(--i,0) * 14ms + 700ms); }
.line { transform: scaleX(0); transform-origin: left; transition: transform .9s cubic-bezier(.2,.7,.2,1) 700ms; }
.hl   { background-repeat: no-repeat; background-size: 0% 100%; transition: background-size .9s cubic-bezier(.2,.7,.2,1) var(--d,500ms); }

.in.rv, .in .rv, .in.pop, .in .pop { opacity: 1; transform: none; }
.in .dot  { transform: scale(1); }
.in .line { transform: scaleX(1); }
.in .hl   { background-size: 100% 100%; }

@keyframes float  { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-18px,20px); } }
@keyframes travel { 0% { left: 0; opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { left: 100%; opacity: 0; } }
@keyframes beat   { 0%,100% { box-shadow: 0 0 0 0 rgba(143,203,74,.55); } 60% { box-shadow: 0 0 0 7px rgba(143,203,74,0); } }
.float  { animation: float 10s ease-in-out infinite; }
.travel { animation: travel 2.8s ease-in-out 1.6s infinite; }
.beat   { animation: beat 2s ease-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .rv, .pop, .dot, .line { opacity: 1; transform: none; transition: none; }
  .hl { background-size: 100% 100%; transition: none; }
  .float, .travel, .beat { animation: none; }
}
`;

/* ---------- Reveal-on-scroll wrapper ---------- */
function Scene({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${className} ${seen ? "in" : ""}`} style={style}>
      {children}
    </div>
  );
}

/* ---------- Small pieces ---------- */
function Highlight({ children, d = 500 }: { children: ReactNode; d?: number }) {
  return (
    <span
      className="hl box-decoration-clone"
      style={{
        ...delay(d),
        backgroundImage: `linear-gradient(to top, "#ffdd00", 0.13em, transparent 0.13em)`,
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
        backgroundColor: "#8FCB4A",
        ["--tw-ring-color" as string]: "rgba(143,203,74,0.3)",
      }}
    />
  );
}

const IconTarget = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
  </svg>
);

const IconUsers = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 19c.5-3.2 3-5 6-5s5.5 1.8 6 5" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M17 14c2.2.2 3.7 1.6 4 4" />
  </svg>
);

function CheckItem({ children, d }: { children: ReactNode; d: number }) {
  return (
    <li
      className="rv flex items-start gap-3 text-sm leading-relaxed"
      style={delay(d)}
    >
      <span
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: "#ffdd00" }}
      >
        <svg
          viewBox="0 0 12 12"
          className="size-3"
          fill="none"
          stroke={INK}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 6.5l2.2 2.2L9.5 3.8" />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  );
}

/* ---------- Mini visuals ---------- */
function NinetyDays() {
  return (
    <div
      aria-hidden
      className="rounded-2xl border border-black/5 bg-[#F8F5EE] p-4"
    >
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: "repeat(30, minmax(0, 1fr))" }}
      >
        {Array.from({ length: 90 }).map((_, i) => (
          <span
            key={i}
            className={`dot aspect-square rounded-full ${i === 33 ? "beat" : ""}`}
            style={
              {
                ["--i" as string]: i,
                backgroundColor: i < 34 ? "#8FCB4A" : "rgba(28,43,32,0.12)",
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div
        className={`mt-3 flex justify-between text-[11px] font-medium uppercase tracking-widest ${MUTED}`}
      >
        <span>Day 1</span>
        <span>Day 90</span>
      </div>
    </div>
  );
}

function PartnerLink() {
  return (
    <div
      aria-hidden
      className="flex items-center rounded-2xl border border-black/5 bg-[#F8F5EE] p-4"
    >
      <span
        className="pop flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1C2B20] text-xs font-medium text-white"
        style={delay(600)}
      >
        You
      </span>
      <div className="relative mx-3 flex-1">
        <div className="line border-t-2 border-dashed border-[#1C2B20]/20" />
        {/* Signal travelling from you to your partner */}
        <span className="travel absolute top-1/2 -mt-1 size-2 rounded-full bg-[#7C5CFF]" />
        <span
          className="pop absolute left-1/2 top-1/2 -ml-[3.1rem] -mt-4 flex items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-1 text-xs font-medium shadow-sm"
          style={delay(1300)}
        >
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7C5CFF] opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[#7C5CFF]" />
          </span>
          Noticed
        </span>
      </div>
      <span
        className="pop flex size-11 shrink-0 items-center justify-center rounded-full bg-[#7C5CFF] text-xs font-medium text-white"
        style={delay(900)}
      >
        Them
      </span>
    </div>
  );
}

/* ---------- Card ---------- */
type CardProps = {
  icon: ReactNode;
  label: string;
  title: ReactNode;
  visual: ReactNode;
  body: string;
  caption: string;
  items: string[];
  footer: ReactNode;
  glow: string;
  stagger: number;
};

function MechanismCard({
  icon,
  label,
  title,
  visual,
  body,
  caption,
  items,
  footer,
  glow,
  stagger,
}: CardProps) {
  return (
    <Scene className="rv h-full" style={delay(stagger)}>
      <article className="group h-full rounded-[32px] bg-gradient-to-b from-white to-[#E4DFD3] p-px shadow-[0_30px_60px_-36px_rgba(28,43,32,0.45)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_40px_70px_-36px_rgba(28,43,32,0.55)]">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[31px] bg-white/90 p-7 backdrop-blur-xl sm:p-9">
          {/* Drifting glows */}
          <div
            className="float pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-90"
            style={{ backgroundColor: glow }}
          />
          <div
            className="float pointer-events-none absolute -bottom-32 -left-24 size-64 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: glow, animationDelay: "-5s" }}
          />

          <div className="relative flex flex-1 flex-col">
            <div className="flex items-center justify-between">
              <span
                className="pop flex size-12 items-center justify-center rounded-2xl border border-black/5 bg-white shadow-sm transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105"
                style={delay(stagger + 150)}
              >
                {icon}
              </span>
              <span
                className="rv rounded-full border border-black/5 bg-white/80 px-3.5 py-1.5 text-xs font-medium tracking-wide text-[#5C5C55] shadow-sm backdrop-blur"
                style={delay(stagger + 250)}
              >
                {label}
              </span>
            </div>

            <h3
              className="rv mt-8 max-w-md text-3xl font-medium leading-[1.15] tracking-tight sm:text-4xl"
              style={delay(stagger + 300)}
            >
              {title}
            </h3>
            <p
              className={`rv mt-4 max-w-md text-sm leading-relaxed sm:text-base ${MUTED}`}
              style={delay(stagger + 420)}
            >
              {body}
            </p>

            <div className="mt-8">{visual}</div>

            <p
              className={`rv mb-4 mt-8 text-[11px] font-medium uppercase tracking-widest ${MUTED}`}
              style={delay(stagger + 600)}
            >
              {caption}
            </p>
            <ul className="space-y-3.5">
              {items.map((item, i) => (
                <CheckItem key={item} d={stagger + 700 + i * 130}>
                  {item}
                </CheckItem>
              ))}
            </ul>

            <div className="mt-auto pt-8">
              <div
                className="rv flex items-start gap-3 rounded-2xl bg-[#1C2B20] p-5 text-sm leading-relaxed text-white/70"
                style={delay(stagger + 1150)}
              >
                <span
                  className="mt-1.5 size-1.5 shrink-0 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ backgroundColor: "#ffdd00" }}
                />
                <p>{footer}</p>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Scene>
  );
}

export default function MechanismsSectionAnimated() {
  return (
    <section className="px-5 py-24 sm:px-10 sm:py-32">
      <style>{ANIMATION_CSS}</style>

      <div className="mx-auto max-w-6xl">
        <Scene>
          <div className="rv mb-8 flex items-center gap-3 text-xs">
            <Dot />
            <span className={`tracking-wide ${MUTED}`}>
              02 · The Mechanisms
            </span>
          </div>

          <h2
            className="rv max-w-4xl text-4xl font-normal leading-[1.1] tracking-tight sm:text-6xl"
            style={delay(100)}
          >
            Why this room is{" "}
            <Highlight d={700}>completely different.</Highlight>
          </h2>
          <p
            className={`rv mt-8 max-w-2xl text-base leading-relaxed sm:text-lg ${MUTED}`}
            style={delay(250)}
          >
            The problem isn&apos;t that you don&apos;t want it badly enough. The
            problem is that when motivation disappears, most systems have no
            friction.
          </p>
        </Scene>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <MechanismCard
            stagger={0}
            icon={<IconTarget />}
            label="Mechanism 01"
            title={
              <>
                Pick one thing. Then give it{" "}
                <Highlight d={900}>90 days.</Highlight>
              </>
            }
            body="Not seven goals. Not “I just want to improve myself.” One clear result that actually matters to you."
            visual={<NinetyDays />}
            caption="Goal Consultation with Taifaq"
            items={[
              "What exactly are you trying to achieve?",
              "What actions actually move you there?",
              "A clear, daily 90-day execution system",
            ]}
            footer={
              <>
                You leave that conversation with{" "}
                <span className="text-white">zero guessing.</span> You know the
                result, you know the work, then you execute.
              </>
            }
            glow="#7BE28A"
          />

          <MechanismCard
            stagger={150}
            icon={<IconUsers />}
            label="Mechanism 02"
            title={
              <>
                Someone will <Highlight d={1000}>notice</Highlight> when you
                don’t show up.
              </>
            }
            body="Most accountability systems depend solely on you. When you skip or disappear, nobody notices. In Result Room, disappearing has friction."
            visual={<PartnerLink />}
            caption="Your 1-on-1 Accountability Partner"
            items={[
              "Paired with one person inside the room for the full 90 days",
              "You track progress together and report the work",
              "Neither of you slips into hiding",
            ]}
            footer={
              <>
                You don’t need another lesson on discipline. You need to know
                that{" "}
                <span className="text-white">
                  disappearing will be noticed.
                </span>
              </>
            }
            glow="#9B85FF"
          />
        </div>
      </div>
    </section>
  );
}
