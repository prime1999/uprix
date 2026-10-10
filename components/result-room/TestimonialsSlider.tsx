"use client";

import Image, { type StaticImageData } from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import screenOne from "@/app/assets/images/result-room-testimonials/screen1.jpg";
import screenTwo from "@/app/assets/images/result-room-testimonials/screen2.jpg";
import screenThree from "@/app/assets/images/result-room-testimonials/screen3.jpg";
import screenFour from "@/app/assets/images/result-room-testimonials/screen4.jpg";
import screenFive from "@/app/assets/images/result-room-testimonials/screen5.jpg";
import screenSix from "@/app/assets/images/result-room-testimonials/screen6.jpg";
import screenSeven from "@/app/assets/images/result-room-testimonials/screen7.jpg";
import screenEight from "@/app/assets/images/result-room-testimonials/screen8.jpg";
import screenNine from "@/app/assets/images/result-room-testimonials/screen9.jpg";

const TESTIMONIAL_IMAGES: StaticImageData[] = [
  screenOne,
  screenTwo,
  screenThree,
  screenFour,
  screenFive,
  screenSix,
  screenSeven,
  screenEight,
  screenNine,
];

/** Time each slide stays in the centre (ms). */
const SLIDE_DURATION = 4000;

/**
 * Every card has the same width; only the height changes with each image.
 * Because next/image static imports expose width/height, we know every
 * aspect ratio up front, so the stage can be sized to the tallest image
 * and shorter cards are simply centred (no layout shift, no wasted space
 * when a short image is active).
 */
const RATIOS = TESTIMONIAL_IMAGES.map((img) => img.height / img.width);
const MAX_RATIO = Math.max(...RATIOS);

/** Signed, wrapped distance from the active slide (shortest way round). */
function offsetFrom(index: number, active: number, total: number) {
  const half = Math.floor(total / 2);
  let d = ((index - active + total + half) % total) - half;
  if (total % 2 === 0 && d === -half) d = half;
  return d;
}

function cardStyle(d: number): CSSProperties {
  const sign = d < 0 ? -1 : 1;
  const abs = Math.abs(d);

  if (abs === 0) {
    return {
      transform: "translate(-50%, -50%) scale(1)",
      opacity: 1,
      zIndex: 5,
      filter: "none",
    };
  }
  if (abs === 1) {
    return {
      transform: `translate(calc(-50% + ${sign * 80}%), -50%) scale(0.85)`,
      opacity: 0.65,
      zIndex: 4,
      filter: "blur(2px)",
    };
  }
  if (abs === 2) {
    return {
      transform: `translate(calc(-50% + ${sign * 135}%), -50%) scale(0.7)`,
      opacity: 0.3,
      zIndex: 3,
      filter: "blur(4px)",
    };
  }
  return {
    transform: "translate(-50%, -50%) scale(0.6)",
    opacity: 0,
    zIndex: 0,
    filter: "blur(6px)",
    pointerEvents: "none",
  };
}

export default function TestimonialsSlider() {
  const total = TESTIMONIAL_IMAGES.length;
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);

  const barRef = useRef<HTMLDivElement>(null);
  const elapsed = useRef(0);
  const startX = useRef<number | null>(null);
  const swiped = useRef(false);

  const goTo = useCallback(
    (next: number) => {
      elapsed.current = 0;
      if (barRef.current) barRef.current.style.width = "0%";
      setActive(((next % total) + total) % total);
    },
    [total],
  );

  // Respect reduced-motion: start paused.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlaying(false);
    }
  }, []);

  // Autoplay timer. Tracks elapsed time itself so pausing keeps its place
  // and the progress bar stays in sync without re-rendering every frame.
  useEffect(() => {
    if (!playing) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      elapsed.current += Math.min(now - last, 100); // ignore long tab-hidden gaps
      last = now;

      const progress = Math.min(elapsed.current / SLIDE_DURATION, 1);
      if (barRef.current) barRef.current.style.width = `${progress * 100}%`;

      if (progress >= 1) {
        elapsed.current = 0;
        setActive((current) => (current + 1) % total);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, total]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") goTo(active - 1);
    if (e.key === "ArrowRight") goTo(active + 1);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX;
    swiped.current = false;
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 50) {
      swiped.current = true; // stops the click that follows a swipe from navigating again
      goTo(active + (dx < 0 ? 1 : -1));
    }
  };

  const circleButton =
    "grid h-11 w-11 place-items-center rounded-full border border-[#e6e3da] bg-white text-[#2b2a26] shadow-sm transition hover:bg-[#f6f4ee] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2b2a26]";

  return (
    <section
      className="rr-section overflow-hidden py-[clamp(38px,6vw,72px)]"
      aria-label="Result Room testimonials"
    >
      <div className="rr-wrap mx-auto flex w-[calc(100%-44px)] max-w-[1120px] flex-col items-center">
        {/* Dots */}
        <div
          className="mb-7 flex h-4 items-center gap-2.5"
          role="tablist"
          aria-label="Choose testimonial"
        >
          {TESTIMONIAL_IMAGES.map((image, index) => (
            <button
              key={image.src}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Show testimonial ${index + 1}`}
              onClick={() => goTo(index)}
              className={`group relative h-[10px] overflow-hidden rounded-full border transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/40 ${
                index === active
                  ? "w-[34px] border-yellow-400/80 bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(234,179,8,0.6)] hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_12px_22px_-6px_rgba(234,179,8,0.7)]"
                  : "w-[10px] border-yellow-300/80 bg-gradient-to-b from-yellow-200 via-yellow-300 to-yellow-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_8px_-4px_rgba(234,179,8,0.5)]"
              }`}
            >
              {/* glossy highlight */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-[12%] top-px h-1/2 rounded-full bg-gradient-to-b from-white/50 to-transparent"
              />
              {/* light sweep on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-white/30 transition-transform duration-700 group-hover:translate-x-[400%]"
              />
            </button>
          ))}
        </div>

        {/* Stage: height follows the tallest image, shorter ones sit centred */}
        <div
          className="relative w-full touch-pan-y select-none outline-none [--card-w:min(340px,62vw)]"
          style={{ height: `calc(var(--card-w) * ${MAX_RATIO} + 28px)` }}
          role="group"
          aria-roledescription="carousel"
          aria-label="Testimonial screenshots"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (startX.current = null)}
        >
          {TESTIMONIAL_IMAGES.map((image, index) => {
            const d = offsetFrom(index, active, total);
            const isActive = d === 0;

            return (
              <div
                key={image.src}
                role="group"
                aria-roledescription="slide"
                aria-hidden={!isActive}
                aria-label={`Testimonial ${index + 1} of ${total}`}
                onClick={() => {
                  if (swiped.current) {
                    swiped.current = false;
                    return;
                  }
                  if (!isActive) goTo(index);
                }}
                style={{ ...cardStyle(d), width: "var(--card-w)" }}
                className={`absolute left-1/2 top-1/2 overflow-hidden rounded-2xl border border-[#e6e3da] bg-white p-1.5 shadow-[0_24px_50px_-24px_rgba(43,42,38,0.35)] transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.22,0.8,0.24,1)] motion-reduce:transition-opacity ${
                  isActive ? "" : "cursor-pointer"
                }`}
              >
                <Image
                  src={image}
                  alt={`Result Room testimonial ${index + 1}`}
                  className="block h-auto w-full rounded-xl"
                  sizes="(max-width: 640px) 62vw, 340px"
                  placeholder="blur"
                  priority={index === 0}
                  draggable={false}
                />
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center gap-3.5">
          <button
            type="button"
            className={circleButton}
            aria-label="Previous testimonial"
            onClick={() => goTo(active - 1)}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause slideshow" : "Play slideshow"}
            className="group relative inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-blue-400/80 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(59,130,246,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_12px_22px_-6px_rgba(59,130,246,0.7)] active:translate-y-0.5 active:shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_3px_8px_-3px_rgba(59,130,246,0.5)] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40"
          >
            {/* glossy highlight on the top half */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-[10%] top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/50 to-transparent"
            />
            {/* light sweep on hover */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-white/30 transition-transform duration-700 group-hover:translate-x-[400%]"
            />
            <span className="relative inline-flex items-center justify-center">
              {playing ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <rect x="6" y="5" width="4" height="14" rx="1.2" />
                  <rect x="14" y="5" width="4" height="14" rx="1.2" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
                </svg>
              )}
            </span>
          </button>

          <button
            type="button"
            className={circleButton}
            aria-label="Next testimonial"
            onClick={() => goTo(active + 1)}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Progress to next slide (freezes while paused) */}
        <div
          className="mt-6 h-4 w-[min(340px,72%)] overflow-hidden rounded-full border border-yellow-200/70 bg-yellow-50 p-[2px] shadow-[inset_0_2px_4px_rgba(161,98,7,0.18)]"
          aria-hidden="true"
        >
          <div
            ref={barRef}
            className="relative h-full overflow-hidden rounded-full bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 shadow-[inset_0_0_0_1px_rgba(250,204,21,0.8),inset_0_2px_0_rgba(255,255,255,0.45),0_4px_8px_-3px_rgba(234,179,8,0.6)]"
            style={{ width: "0%" }}
          >
            {/* glossy highlight on the top half */}
            <span className="pointer-events-none absolute inset-x-[6px] top-px h-1/2 rounded-full bg-gradient-to-b from-white/50 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
