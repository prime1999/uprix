"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { GLASS, plural } from "./Streak";

/* -------------------------------------------------------------------------- */
/* Layout constants (px) - the list area is always sized for `maxVisible`     */
/* -------------------------------------------------------------------------- */

const ROW = 72;
const GAP = 12;
const STEP = ROW + GAP;
/** How long an expired row stays mounted so its exit animation can play. */
const LEAVE_MS = 900;

/* -------------------------------------------------------------------------- */
/* Schedule                                                                   */
/* -------------------------------------------------------------------------- */

interface Session {
  id: string;
  number: number;
  total: number;
  /** ms timestamp, in the viewer's local time */
  start: number;
}

/**
 * Sessions are anchored to the room's start date, not to calendar months:
 * the first one is on day one, then one every `intervalDays` (14 = every
 * other week, so the same weekday as the room's start) until the room ends.
 */
function buildSessions(
  startDate: string,
  time: string,
  days: number,
  intervalDays: number,
): Session[] {
  const [y, m, d] = startDate.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const step = Math.max(1, intervalDays);
  const starts: number[] = [];

  for (let offset = 0; offset < days; offset += step) {
    starts.push(new Date(y, m - 1, d + offset, hh, mm).getTime());
  }

  return starts.map((start, i) => ({
    id: `session-${i}`,
    number: i + 1,
    total: starts.length,
    start,
  }));
}

const weekdayName = (startDate: string) => {
  const [y, m, d] = startDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long" });
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const pad = (n: number) => String(n).padStart(2, "0");

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (d > 0) return `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

const shortDate = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function rowStyle(rank: number, max: number): CSSProperties {
  // Already started: slides out to the left.
  if (rank < 0) {
    return { transform: "translate3d(-40px, 0, 0) scale(0.96)", opacity: 0 };
  }
  // Waiting for a free slot: parked below the list, invisible.
  if (rank >= max) {
    return {
      transform: `translate3d(0, ${max * STEP + 16}px, 0) scale(0.96)`,
      opacity: 0,
    };
  }
  return { transform: `translate3d(0, ${rank * STEP}px, 0)`, opacity: 1 };
}

/* -------------------------------------------------------------------------- */
/* Row                                                                        */
/* -------------------------------------------------------------------------- */

function SessionRow({
  session,
  now,
  rank,
  maxVisible,
  urgentMs,
}: {
  session: Session;
  now: number;
  rank: number;
  maxVisible: number;
  urgentMs: number;
}) {
  const remaining = session.start - now;
  const live = remaining <= 0;
  const urgent = live || remaining <= urgentMs;
  const date = new Date(session.start);

  const title =
    session.number === 1
      ? "Kickoff session"
      : session.number === session.total
        ? "Final session"
        : `Session ${session.number}`;

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <li
      aria-hidden={rank < 0 || rank >= maxVisible}
      aria-label={`${title}, ${date.toDateString()} at ${time}`}
      style={{ ...rowStyle(rank, maxVisible), height: ROW }}
      className={`absolute inset-x-0 top-0 flex items-center gap-3 rounded-2xl border px-3 transition-[transform,opacity,background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none ${
        urgent
          ? "border-red-300/70 bg-red-50/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-2px_0_rgba(220,38,38,0.12),0_10px_22px_-10px_rgba(239,68,68,0.55)]"
          : "border-white/80 bg-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-2px_0_rgba(60,70,160,0.06),0_10px_20px_-12px_rgba(60,70,160,0.4)]"
      }`}
    >
      {/* Date tile */}
      <div
        className={`relative flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl border border-white/50 bg-gradient-to-b leading-none transition-colors duration-500 ${
          urgent
            ? "from-red-400 to-red-600 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),inset_0_-3px_0_rgba(127,29,29,0.35),0_8px_14px_-6px_rgba(220,38,38,0.8)]"
            : "from-white to-blue-100 text-blue-800 shadow-[inset_0_2px_0_rgba(255,255,255,1),inset_0_-3px_0_rgba(59,130,246,0.18),0_8px_14px_-6px_rgba(59,130,246,0.5)]"
        }`}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-[14%] top-[6%] h-[32%] rounded-xl bg-gradient-to-b from-white/50 to-transparent"
        />
        <span className="relative text-lg font-bold tabular-nums">
          {date.getDate()}
        </span>
        <span className="relative mt-0.5 text-[10px] font-medium uppercase tracking-wide opacity-80">
          {date.toLocaleDateString("en-US", { weekday: "short" })}
        </span>
      </div>

      {/* Title + time + countdown */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-neutral-900">
          {title}
        </p>

        <div className="mt-1 flex items-center gap-1.5">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-200/70 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800">
            <svg
              viewBox="0 0 24 24"
              className="size-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            {time}
          </span>

          <span
            role="timer"
            className={`inline-flex min-w-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums transition-colors duration-500 ${
              urgent
                ? "bg-red-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_8px_-3px_rgba(220,38,38,0.7)]"
                : "bg-neutral-800 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_8px_-3px_rgba(38,38,38,0.6)]"
            }`}
          >
            {urgent && (
              <span className="relative flex size-2 shrink-0" aria-hidden>
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75 motion-reduce:animate-none" />
                <span className="relative size-2 rounded-full bg-white" />
              </span>
            )}
            <span className="truncate">
              {live ? "Live now" : formatCountdown(remaining)}
            </span>
          </span>
        </div>
      </div>

      {/* Telegram */}
      <span
        aria-hidden
        className="relative hidden size-9 shrink-0 place-items-center rounded-full border border-white/60 bg-gradient-to-b from-sky-300 to-blue-500 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_rgba(30,64,175,0.3),0_8px_12px_-6px_rgba(37,99,235,0.8)] min-[380px]:grid"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      </span>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

interface SessionRemindersProps {
  /** First day of the room, YYYY-MM-DD. The first session is on this day. */
  startDate?: string;
  /** Length of the room in days. */
  days?: number;
  /** Days between sessions (14 = every other week, same weekday). */
  intervalDays?: number;
  /** Session start time, 24h, in the viewer's local time. */
  time?: string;
  /** A row turns red and pulses when it's this close. */
  urgentMinutes?: number;
  /** How long a session stays as "Live now" before it moves on. */
  graceSeconds?: number;
  /** Rows shown at once. */
  maxVisible?: number;
  title?: string;
}

export default function SessionReminders({
  startDate = "2026-10-28",
  days = 90,
  intervalDays = 14,
  time = "20:00",
  urgentMinutes = 60,
  graceSeconds = 60,
  maxVisible = 4,
  title = "Result Conversation schedule",
}: SessionRemindersProps) {
  const sessions = useMemo(
    () => buildSessions(startDate, time, days, intervalDays),
    [startDate, time, days, intervalDays],
  );

  // null until mounted, so server and client render the same markup.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const graceMs = graceSeconds * 1000;
  const urgentMs = urgentMinutes * 60_000;

  const pending =
    now === null ? [] : sessions.filter((s) => now < s.start + graceMs);
  const rankById = new Map(pending.map((s, i) => [s.id, i]));

  // Visible rows, the one waiting below them, and rows still sliding out.
  const rendered =
    now === null
      ? []
      : sessions.filter(
          (s) =>
            now < s.start + graceMs + LEAVE_MS &&
            (rankById.get(s.id) ?? -1) <= maxVisible,
        );

  const first = sessions[0]?.start;
  const last = sessions[sessions.length - 1]?.start;
  const listHeight = maxVisible * ROW + (maxVisible - 1) * GAP;

  return (
    <section
      className={`${GLASS} mx-auto my-4 w-full max-w-md rounded-3xl p-4 sm:p-5`}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-neutral-500">Your sessions</p>
          <h2 className="text-md font-heading font-semibold tracking-tight text-neutral-900">
            {title}
          </h2>
          {first && last && (
            <p className="mt-0.5 text-xs text-neutral-500">
              Telegram · Every other {weekdayName(startDate)} ·{" "}
              {shortDate(first)} – {shortDate(last)} ·{" "}
              {plural(sessions.length, "session")}
            </p>
          )}
        </div>

        {now !== null && (
          <span className="shrink-0 rounded-full border border-white/80 bg-gradient-to-b from-white to-white/50 px-2.5 py-0.5 text-xs font-medium text-neutral-600 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_8px_-4px_rgba(60,70,160,0.35)]">
            {pending.length} left
          </span>
        )}
      </header>

      {/* The box keeps its height even when fewer than `maxVisible` remain. */}
      <ul className="relative" style={{ height: listHeight }}>
        {rendered.map((session) => (
          <SessionRow
            key={session.id}
            session={session}
            now={now as number}
            rank={rankById.get(session.id) ?? -1}
            maxVisible={maxVisible}
            urgentMs={urgentMs}
          />
        ))}

        {now !== null && pending.length === 0 && (
          <li className="absolute inset-0 grid place-items-center text-center text-sm text-neutral-500">
            All sessions are done. Well played.
          </li>
        )}
      </ul>
    </section>
  );
}
