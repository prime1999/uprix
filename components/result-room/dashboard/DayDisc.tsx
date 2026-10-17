import {
  STATE_LABEL,
  dayOfMonth,
  dayState,
  formatFullDate,
  type DayState,
  type HeatmapCell,
} from "./Streak";

const RADIUS = 19;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SIZES = {
  md: { box: "size-10 sm:size-11", text: "text-sm" },
  sm: { box: "size-9 sm:size-10", text: "text-xs" },
  xs: { box: "size-8 sm:size-9", text: "text-xs" },
} as const;

/** The raised, glossy disc inside the ring. */
const DISC: Record<DayState, string> = {
  submitted:
    "bg-gradient-to-b from-white to-emerald-100 text-emerald-800 shadow-[inset_0_2px_0_rgba(255,255,255,0.95),inset_0_-3px_0_rgba(16,185,129,0.22),0_8px_14px_-6px_rgba(16,185,129,0.6)]",
  today:
    "bg-gradient-to-b from-white to-blue-100 text-blue-900 shadow-[inset_0_2px_0_rgba(255,255,255,0.95),inset_0_-3px_0_rgba(59,130,246,0.22),0_8px_14px_-6px_rgba(59,130,246,0.6)]",
  missed:
    "bg-gradient-to-b from-white to-red-100 text-red-900 shadow-[inset_0_2px_0_rgba(255,255,255,0.95),inset_0_-3px_0_rgba(239,68,68,0.22),0_8px_14px_-6px_rgba(239,68,68,0.6)]",
  upcoming:
    "bg-gradient-to-b from-white/80 to-white/40 text-neutral-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_4px_8px_-4px_rgba(60,70,160,0.25)]",
  empty: "bg-transparent text-transparent",
};

/** Specular highlight on the top of the disc. */
const GLOSS =
  "before:pointer-events-none before:absolute before:inset-x-[16%] before:top-[5%] before:h-[34%] before:rounded-full before:bg-gradient-to-b before:from-white/80 before:to-transparent";

/**
 * One day, drawn as a raised disc with a progress ring:
 * full green ring = submitted, full red ring = missed, short blue arc =
 * today, dotted = upcoming.
 */
export default function DayDisc({
  cell,
  size = "md",
}: {
  cell: HeatmapCell | null;
  size?: keyof typeof SIZES;
}) {
  const state = dayState(cell);
  const s = SIZES[size];

  const label = cell
    ? `${formatFullDate(cell.date)}: ${STATE_LABEL[state]}`
    : STATE_LABEL.empty;

  const glossy =
    state === "submitted" ||
    state === "missed" ||
    state === "today" ||
    state === "upcoming";

  return (
    <div
      role="img"
      aria-label={label}
      title={label}
      className={`relative shrink-0 rounded-full transition-transform duration-200 hover:-translate-y-0.5 hover:scale-105 motion-reduce:transition-none ${s.box} ${
        cell?.isToday
          ? "ring-4 ring-blue-400/50 shadow-[0_0_18px_rgba(59,130,246,0.5)]"
          : ""
      }`}
    >
      {glossy && (
        <svg
          viewBox="0 0 44 44"
          aria-hidden
          className="absolute inset-0 size-full -rotate-90"
        >
          {state === "submitted" && (
            <circle
              cx="22"
              cy="22"
              r={RADIUS}
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              className="stroke-emerald-500 [filter:drop-shadow(0_1px_2px_rgba(16,185,129,0.6))]"
            />
          )}

          {state === "missed" && (
            <circle
              cx="22"
              cy="22"
              r={RADIUS}
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              className="stroke-red-500 [filter:drop-shadow(0_1px_2px_rgba(239,68,68,0.6))]"
            />
          )}

          {state === "today" && (
            <>
              <circle
                cx="22"
                cy="22"
                r={RADIUS}
                fill="none"
                strokeWidth="3"
                className="stroke-blue-200/70"
              />
              <circle
                cx="22"
                cy="22"
                r={RADIUS}
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${CIRCUMFERENCE * 0.32} ${CIRCUMFERENCE}`}
                className="stroke-blue-500 [filter:drop-shadow(0_1px_2px_rgba(59,130,246,0.6))]"
              />
            </>
          )}

          {state === "upcoming" && (
            <circle
              cx="22"
              cy="22"
              r={RADIUS}
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="2 5"
              className="stroke-neutral-300"
            />
          )}
        </svg>
      )}

      <div
        className={`absolute inset-[5px] flex items-center justify-center rounded-full font-semibold tabular-nums ${s.text} ${DISC[state]} ${
          glossy ? GLOSS : ""
        }`}
      >
        <span className="relative z-10">
          {cell ? dayOfMonth(cell.date) : ""}
        </span>
      </div>
    </div>
  );
}
