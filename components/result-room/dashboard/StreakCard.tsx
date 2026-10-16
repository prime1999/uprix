"use client";

import { useCallback, useMemo, useState } from "react";
import { buildHeatmapData } from "@/lib/result-room/build-heatmap";
import DayDisc from "./DayDisc";
import ResponsiveSheet from "./ResponsiveSheet";
import StreakCalendar from "./StreakCalendar";
import {
  GLASS,
  WEEKDAYS,
  computeStats,
  flattenDays,
  pickWeek,
  plural,
} from "./Streak";

interface StreakCardProps {
  startDate: string;
  endDate: string;
  submissionDates: string[];
}

export default function StreakCard({
  startDate,
  endDate,
  submissionDates,
}: StreakCardProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const weeks = useMemo(
    () => buildHeatmapData({ startDate, endDate, submissionDates }),
    [startDate, endDate, submissionDates],
  );
  const days = useMemo(() => flattenDays(weeks), [weeks]);
  const stats = useMemo(() => computeStats(days), [days]);
  const week = weeks[pickWeek(weeks)] ?? [];

  const finished = stats.hasStarted && stats.elapsed === stats.total;

  let title = "Keep it going";
  let message =
    stats.current > 0
      ? `Submit today to extend your ${plural(stats.current, "day")} streak.`
      : "Submit today to start a new streak.";

  if (!stats.hasStarted) {
    title = "Almost time";
    message = "Your streak starts on day one.";
  } else if (finished) {
    title = "Room complete";
    message = `You submitted ${stats.submitted} of ${stats.total} days.`;
  } else if (stats.todaySubmitted) {
    title = "Excellent work!";
    message = `Today's evidence is in. ${plural(stats.current, "day")} in a row.`;
  }

  return (
    <section className={`mx-auto my-4 w-full max-w-md rounded-3xl p-4`}>
      <h2 className="sr-only">Your streak</h2>

      {/* Current week */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, index) => {
          const cell = week[index] ?? null;

          return (
            <div key={index} className="flex flex-col items-center gap-2">
              <DayDisc cell={cell} size="md" />
              <span
                className={`text-xs font-medium ${
                  cell?.isToday ? "text-blue-700" : "text-neutral-500"
                }`}
              >
                {WEEKDAYS[index]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tap to open the 90-day calendar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="group relative mt-3 flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-b from-amber-200/95 to-amber-300/85 p-2.5 pr-3 text-left backdrop-blur-md shadow-[inset_0_2px_0_rgba(255,255,255,0.8),inset_0_-4px_0_rgba(217,119,6,0.22),0_14px_24px_-12px_rgba(217,119,6,0.7)] transition duration-150 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[inset_0_2px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(217,119,6,0.22),0_6px_12px_-8px_rgba(217,119,6,0.7)] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
      >
        {/* glossy top sheen */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/45 to-transparent"
        />

        <span className="relative grid size-10 shrink-0 place-items-center rounded-xl border border-white/90 bg-gradient-to-b from-white to-amber-50 text-amber-500 shadow-[inset_0_2px_0_rgba(255,255,255,1),0_8px_14px_-6px_rgba(180,83,9,0.45)]">
          <svg
            viewBox="0 0 24 24"
            className="size-6"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 2c.5 3-1 4.8-2.6 6.6C7.9 10.300 6.500 12 6.500 14.500A5.500 5.500 0 0 0 12 20a5.500 5.500 0 0 0 5.500-5.500c0-2.200-1-3.800-2.200-5.200-.4 1-1 1.600-1.800 2 .5-2.700-.2-5.800-1.500-9.300z" />
          </svg>
        </span>

        <span className="relative min-w-0 flex-1">
          <span className="block text-sm font-bold text-neutral-900">
            {title}
          </span>
          <span className="block text-xs text-neutral-800/80">{message}</span>
        </span>

        <svg
          viewBox="0 0 24 24"
          className="relative size-5 shrink-0 text-neutral-900 transition-transform duration-150 group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M9 5l7 7-7 7" />
        </svg>
        <span className="sr-only">Open 90-day calendar</span>
      </button>

      <ResponsiveSheet open={open} onClose={close} title="Your 90-day streak">
        <StreakCalendar days={days} stats={stats} />
      </ResponsiveSheet>
    </section>
  );
}
