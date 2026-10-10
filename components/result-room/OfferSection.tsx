"use client";

import { useEffect, useId, useRef, useState } from "react";
import YellowButton from "../miselleneous/yellowButton";

/* ───────────────────────── data ───────────────────────── */

type Item = { title: string; text: string; tag?: string };

const INCLUDES: Item[] = [
  {
    title: "Reframe Your Goal Consultation",
    tag: "₦8,500 value",
    text: "A personal session with Taifaq to turn your goal into something clear, measurable and executable.",
  },
  {
    title: "Your 1-on-1 Accountability Partner",
    text: "One person assigned to walk the full 90 days with you. Not ten random check-in partners. One.",
  },
  {
    title: "The Result Room",
    text: "The actual 90-day execution environment: a structured space built around showing up, tracking progress, reporting the work and getting the result.",
  },
  {
    title: "All Result Conversations",
    tag: "₦15,000 value",
    text: "Resources and conversations designed to help you approach execution with more clarity.",
  },
  {
    title: "The Accountability System",
    text: "Five Xcuse Slots. ₦500 penalties. Five-day no-show eviction. You should not be able to quietly disappear from your own goal.",
  },
];

/* ───────────────────────── hooks ───────────────────────── */

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown] as const;
}

function useCountdown(deadline: number) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, deadline - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const p = (n: number) => String(n).padStart(2, "0");
  if (left === null) return { h: "--", m: "--", s: "--", closed: false };
  return {
    h: p(Math.floor(left / 36e5)),
    m: p(Math.floor((left % 36e5) / 6e4)),
    s: p(Math.floor((left % 6e4) / 1e3)),
    closed: left === 0,
  };
}

/* ───────────────────────── accordion (internal) ───────────────────────── */

function Accordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(0); // -1 = all closed
  const [ref, shown] = useReveal<HTMLDivElement>();
  const uid = useId();

  return (
    <div
      ref={ref}
      className="flex flex-col gap-3 rounded-[28px] bg-gradient-to-b from-neutral-200/70 to-neutral-100/40 p-3 ring-1 ring-black/5 md:p-4"
    >
      {items.map((item, i) => {
        const isOpen = open === i;
        const dimmed = open !== -1 && !isOpen;
        const btnId = `${uid}-b-${i}`;
        const panelId = `${uid}-p-${i}`;

        return (
          <div
            key={item.title}
            style={{ animationDelay: `${i * 90}ms` }}
            className={[
              shown
                ? "animate-[rr-rise_.7s_cubic-bezier(.2,.7,.2,1)_both]"
                : "opacity-0",
              "rounded-2xl border transition-all duration-500 ease-[cubic-bezier(.2,.7,.2,1)]",
              isOpen
                ? "scale-[1.012] border-black/5 bg-white shadow-[0_22px_44px_-24px_rgba(20,20,30,0.4)]"
                : "border-transparent bg-white/55 hover:bg-white/90",
              dimmed ? "opacity-[.82]" : "",
            ].join(" ")}
          >
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#ffd60a]"
              >
                <span className="w-4 font-mono text-xs text-neutral-400">
                  {i + 1}
                </span>

                <span className="flex-1 text-[16px] font-semibold tracking-tight text-[#15151a] md:text-[17px]">
                  {item.title}
                  {item.tag && (
                    <span className="ml-2 inline-block rounded-full bg-[#ffd60a]/35 px-2.5 py-0.5 align-middle font-mono text-[11px] font-medium text-[#6b5400]">
                      {item.tag}
                    </span>
                  )}
                </span>

                {/* + morphs into × */}
                <span
                  className={[
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-500 ease-[cubic-bezier(.2,.7,.2,1)]",
                    isOpen
                      ? "border border-neutral-300 bg-white text-neutral-700 shadow-sm"
                      : "bg-neutral-900 text-white",
                  ].join(" ")}
                >
                  <span
                    className={`relative block h-3.5 w-3.5 transition-transform duration-500 ${
                      isOpen ? "rotate-[135deg]" : ""
                    }`}
                  >
                    <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rounded bg-current" />
                    <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 rounded bg-current" />
                  </span>
                </span>
              </button>
            </h3>

            {/* height animates 0 → auto via grid rows */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.2,.7,.2,1)] ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p
                  className={`px-5 pb-5 pl-[52px] text-[15px] leading-relaxed text-neutral-500 transition-all duration-500 ${
                    isOpen
                      ? "translate-y-0 opacity-100 delay-100"
                      : "-translate-y-2 opacity-0"
                  }`}
                >
                  {item.text}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export default function OfferSection({
  deadline,
  onSecure,
  items = INCLUDES,
}: {
  /** ms timestamp, e.g. Date.UTC(2026, 9, 8, 19, 0, 0) */
  deadline: number;
  onSecure: () => void;
  items?: Item[];
}) {
  const { h, m, s, closed } = useCountdown(deadline);
  const [cardRef, cardShown] = useReveal<HTMLDivElement>();

  return (
    <section className="py-[clamp(70px,10vw,130px)]" id="offer">
      {/* keyframes live here, so no global CSS is needed */}

      <div className="mx-auto w-[calc(100%-44px)] max-w-[1120px]">
        <span className="rr-figure rr-mono font-mono text-xs tracking-[0.02em] text-gray-800 font-semibold">
          Urgency · 90 days. That’s all you get.
        </span>
        <h2 className="text-4xl">
          Those days are
          <br /> coming anyway.
        </h2>
        <p className="mt-5 max-w-xl text-sm text-gray-800">
          There is no version where October freezes until you feel ready. Choose
          one thing and give it a real chance.
        </p>

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
          <Accordion items={items} />

          {/* price card */}
          <div ref={cardRef} className="relative lg:sticky lg:top-24">
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-sky-300/30 blur-3xl"
            />
            <div
              className={`relative overflow-hidden rounded-[32px] bg-gradient-to-b from-[#2b2b30] to-[#121214] p-6 text-white shadow-[0_40px_70px_-30px_rgba(0,0,0,0.7)] ring-1 ring-white/10 md:p-7 ${
                cardShown
                  ? "animate-[rr-rise_.8s_cubic-bezier(.2,.7,.2,1)_both]"
                  : "opacity-0"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-xs leading-snug text-white/60">
                  The Result Room 2.0
                  <br />
                  90-Day Execution
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 font-mono text-[11px] font-semibold text-neutral-900">
                  <i
                    className={`h-1.5 w-1.5 rounded-full ${
                      closed ? "bg-neutral-400" : "animate-pulse bg-red-500"
                    }`}
                  />
                  {closed ? "Closed" : "Closes 8PM"}
                </span>
              </div>

              <strong className="mt-6 block text-[clamp(52px,7vw,72px)] font-semibold leading-none tracking-[-0.05em]">
                ₦10,600
              </strong>
              <em className="mt-2 block text-[15px] not-italic text-white/60">
                ≈ ₦118 a day for 90 days
              </em>

              {/* deposit bar fills when the card appears */}
              <div className="mt-6 h-[7px] w-full overflow-hidden rounded-full bg-white/15">
                <div
                  style={{ width: cardShown ? "47%" : "0%" }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-200 to-white shadow-[0_0_14px_rgba(125,211,252,0.8)] transition-[width] duration-[1400ms] ease-out"
                />
              </div>
              <div className="mt-3 flex items-start justify-between text-sm">
                <div>
                  <div className="text-white/50">Deposit to start</div>
                  <div className="font-semibold">₦5,000</div>
                </div>
                <div className="text-right">
                  <div className="text-white/50">Balance later</div>
                  <div className="font-semibold">₦5,600</div>
                </div>
              </div>

              {/* countdown: digits slide in on every tick */}
              <div className="mt-6 grid grid-cols-3 gap-2.5">
                {[
                  [h, "HOURS"],
                  [m, "MINS"],
                  [s, "SECS"],
                ].map(([v, l]) => (
                  <div
                    key={l}
                    className="overflow-hidden rounded-2xl bg-white/[0.07] py-3 text-center ring-1 ring-white/10"
                  >
                    <b
                      key={v}
                      className="block animate-[rr-tick_.35s_ease-out] text-[28px] font-semibold leading-none tabular-nums tracking-tight"
                    >
                      {v}
                    </b>
                    <small className="mt-1 block font-mono text-[10px] tracking-widest text-white/50">
                      {l}
                    </small>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-sm text-white/55">
                Start with a ₦5,000 deposit. Complete the balance without extra
                charges.
              </p>

              <YellowButton
                disabled={true}
                onClick={onSecure}
                className="mt-5 w-full rounded-full bg-gradient-to-b from-white to-neutral-300 py-4 text-lg font-semibold text-neutral-900 shadow-[inset_0_2px_0_rgba(255,255,255,0.9),0_14px_30px_-10px_rgba(255,255,255,0.35)] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-px"
              >
                Secure my spot
              </YellowButton>

              <p className="mt-4 text-center font-mono text-[11px] text-white/45">
                Oct 18, 2026 → Jan 16, 2027 · 50 people only
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
