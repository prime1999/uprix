"use client";

import { buildHeatmapData } from "@/lib/result-room/build-heatmap";
import DayDisc from "./DayDisc";

/* -------------------------------------------------------------------------- */
/* Types (the cells returned by buildHeatmapData)                             */
/* -------------------------------------------------------------------------- */

export interface HeatmapCell {
  /** YYYY-MM-DD */
  date: string;
  submitted: boolean;
  future: boolean;
  isToday: boolean;
}

/** One calendar week, Monday first. Days outside the room are null. */
export type HeatmapWeek = (HeatmapCell | null)[];

export type DayState = "submitted" | "today" | "missed" | "upcoming" | "empty";

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

export const GLASS =
  "border border-white/60 bg-white/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_-8px_rgba(60,70,160,0.25)]";

export const GLASS_INNER =
  "border border-white/70 bg-white/30 backdrop-blur-md";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export const plural = (n: number, word: string) =>
  `${n} ${word}${n === 1 ? "" : "s"}`;

export const parseDay = (date: string) => new Date(`${date}T00:00:00`);

export const dayOfMonth = (date: string) => Number(date.slice(8, 10));

export const formatFullDate = (date: string) =>
  parseDay(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export const STATE_LABEL: Record<DayState, string> = {
  submitted: "Evidence submitted",
  today: "Today, not submitted yet",
  missed: "No submission",
  upcoming: "Upcoming",
  empty: "Outside the room dates",
};

export function dayState(cell: HeatmapCell | null): DayState {
  if (!cell) return "empty";
  if (cell.isToday) return "today";
  if (cell.submitted) return "submitted";
  if (cell.future) return "upcoming";
  return "missed";
}

/** Flatten the weeks into one ordered list of real days. */
export function flattenDays(weeks: HeatmapWeek[]): HeatmapCell[] {
  return weeks
    .flat()
    .filter((cell): cell is HeatmapCell => !!cell)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** The week to show on the dashboard: this week, or the latest one that has started. */
export function pickWeek(weeks: HeatmapWeek[]): number {
  const thisWeek = weeks.findIndex((week) =>
    week.some((cell) => cell?.isToday),
  );
  if (thisWeek >= 0) return thisWeek;

  let latest = -1;
  weeks.forEach((week, index) => {
    if (week.some((cell) => cell && !cell.future)) latest = index;
  });

  return latest >= 0 ? latest : 0;
}

export function computeStats(days: HeatmapCell[]) {
  let best = 0;
  let run = 0;
  let submitted = 0;
  let missed = 0;
  let elapsed = 0;

  for (const day of days) {
    if (!day.future) elapsed++;

    if (day.submitted) {
      submitted++;
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
      if (!day.future && !day.isToday) missed++;
    }
  }

  // Current streak: count back from today (or the last day that has happened).
  let start = days.findIndex((day) => day.isToday);

  if (start === -1) {
    for (let i = days.length - 1; i >= 0; i--) {
      if (!days[i].future) {
        start = i;
        break;
      }
    }
  }

  // Today isn't over yet, so not having submitted doesn't break the streak.
  if (start >= 0 && days[start].isToday && !days[start].submitted) start -= 1;

  let current = 0;
  for (let i = start; i >= 0 && days[i].submitted; i--) current++;

  return {
    current,
    best,
    submitted,
    missed,
    elapsed,
    total: days.length,
    todaySubmitted: days.some((day) => day.isToday && day.submitted),
    hasStarted: elapsed > 0,
  };
}

export type StreakStats = ReturnType<typeof computeStats>;

export interface MonthGroup {
  key: string;
  label: string;
  /** Empty cells before day 1 so the weekdays line up (Monday first). */
  offset: number;
  days: HeatmapCell[];
  hasToday: boolean;
}

export function groupByMonth(days: HeatmapCell[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();

  for (const day of days) {
    const key = day.date.slice(0, 7);
    let group = groups.get(key);

    if (!group) {
      const date = parseDay(day.date);

      group = {
        key,
        label: date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        offset: (date.getDay() + 6) % 7,
        days: [],
        hasToday: false,
      };

      groups.set(key, group);
    }

    group.days.push(day);
    if (day.isToday) group.hasToday = true;
  }

  return [...groups.values()];
}

interface ResultRoomHeatmapProps {
  startDate: string;
  endDate: string;
  submissionDates: string[];
}

export function ResultRoomHeatmap({
  startDate,
  endDate,
  submissionDates,
}: ResultRoomHeatmapProps) {
  const weeks = buildHeatmapData({
    startDate,
    endDate,
    submissionDates,
  });

  return (
    <section className={`${GLASS} my-4 rounded-2xl p-4`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Your progress</h2>
        <span className="text-xs text-muted-foreground">
          {submissionDates.length} submitted
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {weeks.map((week, weekIndex) => (
          <div className="flex shrink-0 flex-col gap-2" key={weekIndex}>
            {week.map((cell, dayIndex) => (
              <DayDisc cell={cell} key={cell?.date ?? `empty-${dayIndex}`} size="sm" />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
