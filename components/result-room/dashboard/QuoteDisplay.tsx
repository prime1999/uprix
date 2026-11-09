"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  Brain,
  Repeat,
  Rocket,
  Sprout,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import {
  Icon3D,
  type Tone,
} from "@/components/result-room/dashboard/fines/icon-3d";

import { getAvailableQuotes, type Quote } from "@/lib/quotes";

type Category = Quote["category"];

interface QuoteDisplayProps {
  /** Automatically switch quotes on a timer. */
  autoRotate?: boolean;

  /** How long each quote stays visible after typing (default 15 seconds). */
  intervalMs?: number;

  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Category styles                                                            */
/* -------------------------------------------------------------------------- */

const CATEGORY_STYLE: Record<Category, { icon: LucideIcon; tone: Tone }> = {
  execution: { icon: Rocket, tone: "red" },
  environment: { icon: Sprout, tone: "amber" },
  consistency: { icon: Repeat, tone: "blue" },
  mindset: { icon: Brain, tone: "violet" },
  growth: { icon: TrendingUp, tone: "emerald" },
};

/* -------------------------------------------------------------------------- */
/* Quote round                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Creates a shuffled round.
 * Every quote appears exactly once.
 */
function buildRound(avoidFirstId?: string): Quote[] {
  const round = getAvailableQuotes();

  // Fisher-Yates shuffle
  for (let i = round.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [round[i], round[j]] = [round[j], round[i]];
  }

  // Prevent consecutive rounds from starting with the same quote.
  if (round.length > 1 && round[0].id === avoidFirstId) {
    const swapIndex = 1 + Math.floor(Math.random() * (round.length - 1));

    [round[0], round[swapIndex]] = [round[swapIndex], round[0]];
  }

  return round;
}

/* -------------------------------------------------------------------------- */
/* Animation settings                                                         */
/* -------------------------------------------------------------------------- */

type Phase = "enter" | "shown" | "exit";

const TYPE_DELAY_MS = 220;
const TICK_MS = 22;
const TYPE_IN_MAX_MS = 1800;
const TYPE_OUT_MAX_MS = 700;

const POP_IN: Keyframe[] = [
  { transform: "scale(0)", opacity: 0, offset: 0 },
  { transform: "scale(1.35)", opacity: 1, offset: 0.5 },
  { transform: "scale(0.88)", opacity: 1, offset: 0.72 },
  { transform: "scale(1.06)", opacity: 1, offset: 0.88 },
  { transform: "scale(1)", opacity: 1, offset: 1 },
];

const POP_OUT: Keyframe[] = [
  { transform: "scale(1)", opacity: 1, offset: 0 },
  { transform: "scale(1.06)", opacity: 1, offset: 0.14 },
  { transform: "scale(0.88)", opacity: 1, offset: 0.3 },
  { transform: "scale(1.35)", opacity: 1, offset: 0.55 },
  { transform: "scale(0)", opacity: 0, offset: 1 },
];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function QuoteDisplay({
  autoRotate = true,
  intervalMs = 15000,
  className = "",
}: QuoteDisplayProps) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [phase, setPhase] = useState<Phase>("enter");
  const [paused, setPaused] = useState(false);
  const [typed, setTyped] = useState(0);
  const [wraps, setWraps] = useState(false);

  const textRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  const quoteRef = useRef<Quote | null>(null);
  const busyRef = useRef(false);

  const roundRef = useRef<Quote[]>([]);
  const indexRef = useRef(0);

  const typingRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  const delayRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const exitRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* ------------------------------------------------------------------------ */
  /* Keep the current quote accessible to timers and callbacks.               */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    quoteRef.current = quote;
  }, [quote]);

  /* ------------------------------------------------------------------------ */
  /* Get the next quote in the current round.                                 */
  /* ------------------------------------------------------------------------ */

  const takeNext = useCallback((): Quote | null => {
    if (indexRef.current >= roundRef.current.length) {
      roundRef.current = buildRound(quoteRef.current?.id);
      indexRef.current = 0;
    }

    const next = roundRef.current[indexRef.current];

    if (!next) return null;

    indexRef.current++;

    return next;
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Initialize the first quote on the client.                                */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    roundRef.current = buildRound();
    indexRef.current = 0;

    setQuote(takeNext());
  }, [takeNext]);

  /* ------------------------------------------------------------------------ */
  /* Typing and erasing animation.                                            */
  /* ------------------------------------------------------------------------ */

  const runTyping = useCallback(
    (direction: "in" | "out", total: number, onDone: () => void) => {
      clearInterval(typingRef.current);

      const maxMs = direction === "in" ? TYPE_IN_MAX_MS : TYPE_OUT_MAX_MS;

      const perTick = Math.max(1, Math.ceil(total / (maxMs / TICK_MS)));

      let n = direction === "in" ? 0 : total;

      typingRef.current = setInterval(() => {
        n =
          direction === "in"
            ? Math.min(total, n + perTick)
            : Math.max(0, n - perTick);

        setTyped(n);

        const finished = direction === "in" ? n >= total : n <= 0;

        if (finished) {
          clearInterval(typingRef.current);
          typingRef.current = undefined;
          onDone();
        }
      }, TICK_MS);
    },
    [],
  );

  /* ------------------------------------------------------------------------ */
  /* Enter animation whenever a new quote is selected.                       */
  /* ------------------------------------------------------------------------ */

  useLayoutEffect(() => {
    if (!quote) return;

    const total = quote.quote.length + quote.author.length + 4;

    const finish = () => {
      setPhase("shown");
      busyRef.current = false;
    };

    if (prefersReducedMotion()) {
      setTyped(total);
      finish();
      return;
    }

    setTyped(0);
    setPhase("enter");

    const animation = iconRef.current?.animate(POP_IN, {
      duration: 650,
      easing: "ease-out",
      fill: "both",
    });

    delayRef.current = setTimeout(() => {
      runTyping("in", total, finish);
    }, TYPE_DELAY_MS);

    return () => {
      clearTimeout(delayRef.current);
      clearInterval(typingRef.current);

      animation?.cancel();
    };
  }, [quote, runTyping]);

  /* ------------------------------------------------------------------------ */
  /* Global timer cleanup.                                                    */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    return () => {
      clearTimeout(delayRef.current);
      clearTimeout(exitRef.current);
      clearInterval(typingRef.current);
      iconRef.current?.getAnimations().forEach((a) => a.cancel());
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Advance to the next quote.                                               */
  /* ------------------------------------------------------------------------ */

  const advance = useCallback(() => {
    const current = quoteRef.current;

    if (busyRef.current || !current) return;

    const next = takeNext();

    if (!next || next.id === current.id) return;

    busyRef.current = true;

    if (prefersReducedMotion()) {
      setQuote(next);
      return;
    }

    setPhase("exit");

    iconRef.current?.animate(POP_OUT, {
      duration: 550,
      easing: "ease-in",
      fill: "both",
    });

    const total = current.quote.length + current.author.length + 4;

    runTyping("out", total, () => {
      exitRef.current = setTimeout(() => {
        setQuote(next);
      }, 120);
    });
  }, [runTyping, takeNext]);

  /* ------------------------------------------------------------------------ */
  /* Auto-rotation.                                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!autoRotate || paused || !quote || phase !== "shown") {
      return;
    }

    const id = setTimeout(advance, Math.max(0, intervalMs));

    return () => clearTimeout(id);
  }, [autoRotate, paused, quote, phase, intervalMs, advance]);

  /* ------------------------------------------------------------------------ */
  /* Measure text wrapping.                                                    */
  /* ------------------------------------------------------------------------ */

  useLayoutEffect(() => {
    const el = textRef.current;

    if (!el) return;

    const measure = () => {
      setWraps(el.getClientRects().length > 1);
    };

    measure();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);

    if (el.parentElement) {
      observer.observe(el.parentElement);
    }

    return () => observer.disconnect();
  }, [quote]);

  /* ------------------------------------------------------------------------ */
  /* Render data.                                                             */
  /* ------------------------------------------------------------------------ */

  const style = quote ? CATEGORY_STYLE[quote.category] : null;

  const quoteText = quote ? `“${quote.quote}”` : "";
  const authorText = quote ? `— ${quote.author}` : "";

  const quoteShown = quoteText.slice(0, typed);
  const quoteHidden = quoteText.slice(typed);

  const authorTyped = Math.max(0, typed - quoteText.length);

  const authorShown = authorText.slice(0, authorTyped);
  const authorHidden = authorText.slice(authorTyped);

  const typing = phase !== "shown";

  const caretInQuote = typing && typed < quoteText.length;
  const caretInAuthor = typing && !caretInQuote;

  const caret = (
    <span
      aria-hidden="true"
      className="-mr-px inline-block h-[1em] w-0 animate-pulse border-r border-neutral-500 align-[-0.15em]"
    />
  );

  /* ------------------------------------------------------------------------ */
  /* UI                                                                       */
  /* ------------------------------------------------------------------------ */

  return (
    <section
      aria-label="Quote"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`relative flex min-h-16 w-full items-center overflow-hidden py-1 ${className}`}
    >
      {quote && style && (
        <figure className="flex w-full items-center justify-center gap-3">
          {/* Accessible version for screen readers */}
          <span className="sr-only">
            {quoteText} {authorText}
          </span>

          {/* Animated category icon */}
          <span
            ref={iconRef}
            aria-hidden="true"
            className="flex size-6 shrink-0 items-center justify-center"
          >
            <span className="block origin-center scale-[0.6]">
              <Icon3D icon={style.icon} tone={style.tone} size="sm" />
            </span>
          </span>

          {/* Quote and author */}
          <figcaption
            aria-hidden="true"
            className={`min-w-0 text-xs leading-snug ${
              wraps ? "line-clamp-2" : ""
            }`}
          >
            <span ref={textRef} className="font-medium text-neutral-800">
              {quoteShown}
              {caretInQuote && caret}
              <span className="invisible">{quoteHidden}</span>
            </span>

            {wraps ? (
              <>
                {" "}
                <span className="whitespace-nowrap text-neutral-500">
                  {authorShown}
                  {caretInAuthor && caret}
                  <span className="invisible">{authorHidden}</span>
                </span>
              </>
            ) : (
              <span className="mt-0.5 block text-neutral-500">
                {authorShown}
                {caretInAuthor && caret}
                <span className="invisible">{authorHidden}</span>
              </span>
            )}
          </figcaption>
        </figure>
      )}
    </section>
  );
}
