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
/* Animation: icon pops in/out with a bounce, text types in / erases          */
/* -------------------------------------------------------------------------- */

type Phase = "enter" | "shown" | "exit";

/** Wait for the icon to start popping before the text begins typing. */
const TYPE_DELAY_MS = 220;
/** One typing tick. */
const TICK_MS = 22;
/** The longest typing in / erasing out is allowed to take. */
const TYPE_IN_MAX_MS = 1800;
const TYPE_OUT_MAX_MS = 700;

const POP_IN: Keyframe[] = [
  { transform: "scale(0)", opacity: 0, offset: 0 },
  { transform: "scale(1.35)", opacity: 1, offset: 0.5 },
  { transform: "scale(0.88)", opacity: 1, offset: 0.72 },
  { transform: "scale(1.06)", opacity: 1, offset: 0.88 },
  { transform: "scale(1)", opacity: 1, offset: 1 },
];

// The same bounce, played out: a small hop up, then shrinking away.
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
  // Starts empty: a random pick during render would differ between the server
  // and the browser and cause a hydration mismatch.
  const [quote, setQuote] = useState<Quote | null>(null);
  const [phase, setPhase] = useState<Phase>("enter");
  const [paused, setPaused] = useState(false);

  // How many characters of "quote + author" are showing right now.
  const [typed, setTyped] = useState(0);

  // Does the quote text wrap onto a second line? Decides where the author goes.
  const textRef = useRef<HTMLSpanElement>(null);
  const [wraps, setWraps] = useState(false);

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

  /** Types the text in (or erases it) one step at a time. */
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

        if (n === (direction === "in" ? total : 0)) {
          clearInterval(typingRef.current);
          onDone();
        }
      }, TICK_MS);
    },
    [],
  );

  // A new quote: the icon bounces in, then the text types itself out.
  // Runs before paint so the old text never flashes on the new quote.
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

    iconRef.current?.animate(POP_IN, {
      duration: 650,
      easing: "ease-out",
      fill: "both",
    });

    delayRef.current = setTimeout(
      () => runTyping("in", total, finish),
      TYPE_DELAY_MS,
    );

    return () => {
      clearTimeout(delayRef.current);
      clearInterval(typingRef.current);
    };
  }, [quote, runTyping]);

  useEffect(() => {
    return () => {
      clearTimeout(delayRef.current);
      clearTimeout(exitRef.current);
      clearInterval(typingRef.current);
    };
  }, []);

  /** Icon bounces out and the text erases, then the next quote comes in. */
  const advance = useCallback(() => {
    const current = quoteRef.current;
    if (busyRef.current || !current) return;

    const next = takeNext();

    // Only one quote in total: nothing to switch to.
    if (next.id === current.id) return;

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
      // Let the icon finish shrinking before the next quote starts.
      exitRef.current = setTimeout(() => setQuote(next), 120);
    });
  }, [runTyping, takeNext]);

  // Auto-rotate: the timer starts once a quote has finished typing, and
  // pauses on hover/focus.
  useEffect(() => {
    if (!autoRotate || paused || !quote || phase !== "shown") return;

    const id = setTimeout(advance, intervalMs);
    return () => clearTimeout(id);
  }, [autoRotate, paused, quote, phase, intervalMs, advance]);

  // Measure the quote (before paint, and again if the width changes).
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const measure = () => setWraps(el.getClientRects().length > 1);

    measure();

    const observer = new ResizeObserver(measure);
    // Inline text has no box of its own to watch, so watch its container.
    if (el.parentElement) observer.observe(el.parentElement);
    return () => observer.disconnect();
  }, [quote]);

  const style = quote ? CATEGORY_STYLE[quote.category] : null;

  // The full text is always laid out (the untyped part is just invisible), so
  // the line breaks and the author position never jump while typing.
  const quoteText = quote ? `\u201C${quote.quote}\u201D` : "";
  const authorText = quote ? `\u2014 ${quote.author}` : "";

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
      aria-hidden
      className="-mr-px inline-block h-[1em] w-0 animate-pulse border-r border-neutral-500 align-[-0.15em]"
    />
  );

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
          {/* Screen readers get the whole quote at once, not letter by letter. */}
          <span className="sr-only">
            {quoteText} {authorText}
          </span>

          {/*
            Icon3D's smallest size is "sm", so it is shrunk here. The outer box
            sets the space it takes (and bounces); change scale-[0.6] to make
            the icon larger or smaller, and size-6 to match.
          */}
          <span
            ref={iconRef}
            aria-hidden
            className="flex size-6 shrink-0 items-center justify-center"
          >
            <span className="block origin-center scale-[0.6]">
              <Icon3D icon={style.icon} tone={style.tone} size="sm" />
            </span>
          </span>

          {/*
            One line: the author goes below the quote.
            Two lines: the author sits beside the end of the second line.
            Never more than 2 lines in total.
          */}
          <figcaption
            aria-hidden
            className={`min-w-0 text-xs leading-snug ${wraps ? "line-clamp-2" : ""}`}
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
