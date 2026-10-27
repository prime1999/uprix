"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Brain,
  Repeat,
  Rocket,
  Sprout,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

// Adjust these paths to match your project.
import {
  Icon3D,
  type Tone,
} from "@/components/result-room/dashboard/fines/icon-3d";
import { getRandomQuote, type Quote } from "@/lib/quotes";

type Category = Quote["category"];

interface QuoteDisplayProps {
  /** Slide to the next quote on a timer. */
  autoRotate?: boolean;
  /** How long each quote stays on screen, in ms (default 15 seconds). */
  intervalMs?: number;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* One icon and colour per category                                           */
/* -------------------------------------------------------------------------- */

const CATEGORY_STYLE: Record<Category, { icon: LucideIcon; tone: Tone }> = {
  execution: { icon: Rocket, tone: "red" },
  environment: { icon: Sprout, tone: "amber" },
  consistency: { icon: Repeat, tone: "blue" },
  mindset: { icon: Brain, tone: "violet" },
  growth: { icon: TrendingUp, tone: "emerald" },
};

/* -------------------------------------------------------------------------- */
/* Every quote, once each, in random order                                    */
/* -------------------------------------------------------------------------- */

/**
 * Builds one full round of quotes: every quote exactly once, shuffled.
 * It only needs getRandomQuote, so your quotes file needs no changes:
 * the round is complete when getRandomQuote has nothing new left to give.
 * `avoidFirstId` stops a new round from opening with the quote that just ran.
 */
function buildRound(avoidFirstId?: string): Quote[] {
  const round: Quote[] = [];
  const ids: string[] = [];

  for (let i = 0; i < 1000; i++) {
    const quote = getRandomQuote({ excludeIds: ids });

    if (ids.includes(quote.id)) break; // nothing new left
    ids.push(quote.id);
    round.push(quote);
  }

  if (round.length > 1 && round[0].id === avoidFirstId) {
    const last = round.length - 1;
    [round[0], round[last]] = [round[last], round[0]];
  }

  return round;
}

/* -------------------------------------------------------------------------- */
/* Slide animation                                                            */
/* -------------------------------------------------------------------------- */

type Phase = "enter" | "shown" | "exit";

/** Time the old quote takes to slide out before the next one slides in. */
const OUT_MS = 500;

const SLIDE: Record<Phase, string> = {
  // Waiting off to the right, invisible. No transition, so it never "travels".
  enter: "translate-x-10 opacity-0 transition-none",
  // Settled in place.
  shown:
    "translate-x-0 opacity-100 transition-[transform,opacity] duration-[600ms] ease-[cubic-bezier(.22,1,.36,1)]",
  // Leaving to the left.
  exit: "-translate-x-10 opacity-0 transition-[transform,opacity] duration-500 ease-in",
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function QuoteDisplay({
  autoRotate = true,
  intervalMs = 15000,
  className = "",
}: QuoteDisplayProps) {
  // Starts empty: a random pick during render would differ between the server
  // and the browser and cause a hydration mismatch.
  const [quote, setQuote] = useState<Quote | null>(null);
  const [phase, setPhase] = useState<Phase>("enter");
  const [paused, setPaused] = useState(false);

  const quoteRef = useRef<Quote | null>(null);
  const busyRef = useRef(false);
  const roundRef = useRef<Quote[]>([]);
  const indexRef = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const schedule = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    quoteRef.current = quote;
  }, [quote]);

  /** The next quote in the round; starts a fresh shuffled round when done. */
  const takeNext = useCallback((): Quote => {
    if (indexRef.current >= roundRef.current.length) {
      roundRef.current = buildRound(quoteRef.current?.id);
      indexRef.current = 0;
    }

    return roundRef.current[indexRef.current++];
  }, []);

  // First quote, picked in the browser.
  useEffect(() => {
    roundRef.current = buildRound();
    indexRef.current = 0;
    setQuote(takeNext());
  }, [takeNext]);

  // A new quote starts off to the right, then slides in on the next frame.
  useEffect(() => {
    if (!quote) return;

    const timer = setTimeout(() => {
      setPhase("shown");
      busyRef.current = false;
    }, 60);

    return () => clearTimeout(timer);
  }, [quote]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  /** Slide the current quote out to the left, then slide the next one in. */
  const advance = useCallback(() => {
    if (busyRef.current || !quoteRef.current) return;

    const next = takeNext();

    // Only one quote in total: nothing to slide to.
    if (next.id === quoteRef.current.id) return;

    busyRef.current = true;
    setPhase("exit");

    schedule(() => {
      setQuote(next);
      setPhase("enter");
    }, OUT_MS);
  }, [schedule, takeNext]);

  // Auto-rotate. The timer restarts after every swap and pauses on hover/focus.
  useEffect(() => {
    if (!autoRotate || paused || !quote) return;

    const id = setInterval(advance, intervalMs);
    return () => clearInterval(id);
  }, [autoRotate, paused, quote, intervalMs, advance]);

  const style = quote ? CATEGORY_STYLE[quote.category] : null;

  return (
    <section
      aria-label="Quote"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      // overflow-hidden clips the slide so only one quote is ever visible.
      className={`relative flex min-h-16 w-full items-center overflow-hidden py-1 ${className}`}
    >
      {quote && style && (
        <figure
          className={`flex w-full items-center justify-center gap-3 motion-reduce:transition-none ${SLIDE[phase]}`}
        >
          <Icon3D icon={style.icon} tone={style.tone} size="sm" />

          <div className="min-w-0">
            <blockquote className="text-xs font-medium leading-snug text-neutral-800">
              “{quote.quote}”
            </blockquote>

            <figcaption className="mt-0.5 text-xs text-neutral-500">
              — {quote.author}
            </figcaption>
          </div>
        </figure>
      )}
    </section>
  );
}
