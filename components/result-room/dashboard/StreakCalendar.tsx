"use client";

import { useEffect, useMemo, useRef } from "react";
import DayDisc from "./DayDisc";
import {
  GLASS_INNER,
  WEEKDAYS,
  groupByMonth,
  plural,
  type HeatmapCell,
  type StreakStats,
} from "./Streak";

const TILE_3D =
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-3px_0_rgba(60,70,160,0.08),0_8px_16px_-8px_rgba(60,70,160,0.35)]";

function StatTile({ value, label }: { value: string | number; label: string }) {
  return (
    <div
      className={`${GLASS_INNER} ${TILE_3D} rounded-2xl px-3 py-2.5 text-center`}
    >
      <div className="text-xl font-bold tabular-nums text-neutral-900">
        {value}
      </div>
      <div className="text-xs text-neutral-600">{label}</div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-3 rounded-full ${className}`} />
      {label}
    </span>
  );
}

export default function StreakCalendar({
  days,
  stats,
}: {
  days: HeatmapCell[];
  stats: StreakStats;
}) {
  const months = useMemo(() => groupByMonth(days), [days]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLElement>(null);

  // Open on the month that contains today.
  useEffect(() => {
    const container = scrollRef.current;
    const target = currentRef.current;
    if (container && target) container.scrollTop = target.offsetTop - 8;
  }, []);

  const currentKey =
    months.find((m) => m.hasToday)?.key ??
    [...months].reverse().find((m) => m.days.some((d) => !d.future))?.key;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid shrink-0 grid-cols-3 gap-2.5 px-5 pb-3 md:px-6">
        <StatTile value={stats.current} label="Current streak" />
        <StatTile value={stats.best} label="Best streak" />
        <StatTile
          value={`${stats.submitted}/${stats.total}`}
          label="Days submitted"
        />
      </div>

      <div
        className="grid shrink-0 grid-cols-7 px-5 pb-1 text-center text-xs font-medium text-neutral-500 md:px-6"
        aria-hidden
      >
        {WEEKDAYS.map((day, index) => (
          <span key={index}>{day}</span>
        ))}
      </div>

      <div
        ref={scrollRef}
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 md:px-6"
      >
        {months.map((month) => {
          const done = month.days.filter((d) => d.submitted).length;

          return (
            <section
              key={month.key}
              ref={month.key === currentKey ? currentRef : undefined}
              className="pb-5"
            >
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-sm font-semibold text-neutral-800">
                  {month.label}
                </h3>
                <span className="text-xs text-neutral-500">
                  {plural(done, "day")} submitted
                </span>
              </div>

              <div className="grid grid-cols-7 gap-y-2.5">
                {Array.from({ length: month.offset }, (_, i) => (
                  <div key={`offset-${i}`} aria-hidden />
                ))}

                {month.days.map((day) => (
                  <div key={day.date} className="flex justify-center">
                    <DayDisc cell={day} size="xs" />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="flex shrink-0 flex-wrap justify-center gap-x-4 gap-y-1.5 border-t border-white/70 bg-white/30 px-5 py-3 text-xs text-neutral-600 md:px-6">
        <LegendDot className="bg-emerald-500" label="Submitted" />
        <LegendDot className="bg-blue-500" label="Today" />
        <LegendDot
          className="border border-neutral-300 bg-[repeating-linear-gradient(135deg,rgba(115,115,115,0.4)_0px,rgba(115,115,115,0.4)_1px,transparent_1px,transparent_3px)]"
          label="Missed"
        />
        <LegendDot
          className="border border-dashed border-neutral-400"
          label="Upcoming"
        />
      </div>
    </div>
  );
}
