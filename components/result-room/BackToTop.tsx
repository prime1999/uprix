"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  /** scroll distance (px) before the button appears */
  threshold?: number;
  className?: string;
};

const R = 30; // progress ring radius
const C = 2 * Math.PI * R; // ring circumference

export default function BackToTop({ threshold = 500, className = "" }: Props) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(y > threshold);
      setProgress(max > 0 ? Math.min(y / max, 1) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [threshold]);

  const toTop = () => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div
      className={`group fixed right-4 z-50 bottom-[calc(env(safe-area-inset-bottom)+6rem)] md:right-8 md:bottom-8 
        transition-all duration-500 ease-[cubic-bezier(.2,.7,.2,1)]
        ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-6 scale-75 opacity-0"
        } ${className}`}
      aria-hidden={!visible}
    >
      {/* tooltip (desktop) */}
      <span className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 md:block">
        Back to top
      </span>

      <div className="relative size-16">
        {/* scroll progress ring */}
        <svg
          viewBox="0 0 64 64"
          className="absolute inset-0 size-full -rotate-90"
          aria-hidden
        >
          <circle
            cx="32"
            cy="32"
            r={R}
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="3"
          />
          <circle
            cx="32"
            cy="32"
            r={R}
            fill="none"
            stroke="#ca8a04"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            className="transition-[stroke-dashoffset] duration-150"
          />
        </svg>

        {/* 3D yellow button */}
        <button
          type="button"
          onClick={toTop}
          tabIndex={visible ? 0 : -1}
          aria-label="Back to top"
          className="absolute inset-[7px] overflow-hidden rounded-full border border-yellow-300/80
            bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 text-white
            shadow-[inset_0_2px_0_rgba(255,255,255,0.55),0_5px_0_#a16207,0_14px_20px_-4px_rgba(234,179,8,0.6)]
            transition-all duration-200
            hover:-translate-y-0.5 hover:brightness-110
            hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.55),0_7px_0_#a16207,0_18px_26px_-4px_rgba(234,179,8,0.7)]
            active:translate-y-[4px] active:shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_1px_0_#a16207,0_4px_8px_-3px_rgba(234,179,8,0.5)]
            focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/50"
        >
          {/* glossy highlight on the top half */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-[14%] top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/55 to-transparent"
          />
          {/* light sweep on hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-white/35 transition-transform duration-700 group-hover:translate-x-[400%]"
          />
          {/* icon */}
          <span className="relative grid size-full place-items-center">
            <ArrowUp
              className="size-5 drop-shadow-[0_1px_1px_rgba(120,53,15,0.6)] transition-transform duration-300 group-hover:-translate-y-0.5"
              strokeWidth={3}
            />
          </span>
        </button>
      </div>
    </div>
  );
}
