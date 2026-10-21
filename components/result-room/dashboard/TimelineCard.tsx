import type { ReactNode } from "react";
import { GLASS, plural } from "./Streak";

export type Tone = "blue" | "yellow" | "dark";
export type IconName =
  | "submit"
  | "partner"
  | "report"
  | "fine"
  | "lock"
  | "evict";

export interface TimelineItem {
  id: string;
  title: string;
  /** The key info: a deadline or a consequence. */
  detail: string;
  icon: IconName;
  tone: Tone;
}

const ICONS: Record<IconName, ReactNode> = {
  submit: (
    <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  ),
  partner: (
    <>
      <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" />
      <circle cx="10" cy="8" r="3" />
      <path d="M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 5.2a3 3 0 0 1 0 5.6" />
    </>
  ),
  report: <path d="M5 21V4m0 0h11l-2 4 2 4H5" />,
  fine: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  evict: (
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4m0 0l4 4m-4-4h11" />
  ),
};

/** Raised 3D tile behind each icon. */
const TILE: Record<Tone, string> = {
  blue: "from-blue-400 to-blue-600 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),inset_0_-3px_0_rgba(30,58,138,0.35),0_10px_16px_-8px_rgba(37,99,235,0.8)]",
  yellow:
    "from-yellow-200 to-yellow-400 text-neutral-900 shadow-[inset_0_2px_0_rgba(255,255,255,0.7),inset_0_-3px_0_rgba(161,98,7,0.3),0_10px_16px_-8px_rgba(234,179,8,0.85)]",
  dark: "from-neutral-600 to-neutral-800 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.25),inset_0_-3px_0_rgba(0,0,0,0.4),0_10px_16px_-8px_rgba(38,38,38,0.8)]",
};

/** Glowing bead on the timeline. */
const DOT: Record<Tone, string> = {
  blue: "from-blue-400 to-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_0_0_4px_rgba(59,130,246,0.22),0_6px_10px_-2px_rgba(37,99,235,0.7)]",
  yellow:
    "from-yellow-200 to-yellow-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_0_0_4px_rgba(250,204,21,0.3),0_6px_10px_-2px_rgba(234,179,8,0.7)]",
  dark: "from-neutral-600 to-neutral-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_0_0_4px_rgba(64,64,64,0.18),0_6px_10px_-2px_rgba(38,38,38,0.6)]",
};

const DETAIL: Record<Tone, string> = {
  blue: "text-blue-700",
  yellow: "text-amber-700",
  dark: "text-neutral-700",
};

// 3D Glassmorphic styles for life slot balls
const BLUE_BALL =
  "bg-gradient-to-b from-blue-400 to-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-2px_0_rgba(30,58,138,0.35),0_5px_8px_-3px_rgba(37,99,235,0.8)]";
const RED_BALL =
  "bg-gradient-to-b from-rose-400 to-red-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-2px_0_rgba(153,27,27,0.35),0_5px_8px_-3px_rgba(225,29,72,0.8)]";

interface TimelineCardProps {
  title: string;
  items: TimelineItem[];
  /** Total available slots (e.g., 5) */
  lives?: number;
  /** Used/consumed slots (displayed in RED first) */
  slots?: number;
  className?: string;
}

export default function TimelineCard({
  title,
  items,
  lives = 5,
  slots = 0,
  className = "",
}: TimelineCardProps) {
  // Ensure slots don't exceed lives or fall below 0
  const usedSlots = Math.min(Math.max(slots, 0), lives);

  return (
    <section
      className={`${GLASS} flex flex-col rounded-3xl p-4 sm:p-5 ${className}`}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight text-neutral-900">
          {title}
        </h2>
        <span className="rounded-full border border-white/80 bg-gradient-to-b from-white to-white/50 px-2.5 py-0.5 text-xs font-medium text-neutral-600 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_8px_-4px_rgba(60,70,160,0.35)]">
          {plural(items.length, "step")}
        </span>
      </header>

      {lives && title === "Penalties" ? (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/50 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-2px_0_rgba(59,130,246,0.08),0_10px_20px_-12px_rgba(59,130,246,0.45)]">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900">Life slots</p>
            <p className="text-xs text-neutral-500">Fines start after these</p>
          </div>

          <div
            role="img"
            aria-label={`${usedSlots} of ${lives} life slots used`}
            className="flex shrink-0 gap-1.5"
          >
            {Array.from({ length: lives }, (_, i) => {
              // Used slots (red) render first
              const isRed = i < usedSlots;

              return (
                <span
                  key={i}
                  className={`relative size-5 rounded-full transition-all duration-300 before:absolute before:inset-x-[20%] before:top-[8%] before:h-[35%] before:rounded-full before:bg-white/55 ${
                    isRed ? RED_BALL : BLUE_BALL
                  }`}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={item.id}
              className={`relative flex gap-3 ${isLast ? "" : "pb-5"}`}
            >
              {/* connector to the next bead */}
              {!isLast && (
                <span
                  aria-hidden
                  className="absolute left-[11px] top-6 -bottom-6 w-0.5 rounded-full bg-neutral-800/20"
                />
              )}

              <div className="relative z-10 mt-3 flex size-6 shrink-0 items-center justify-center">
                <span
                  className={`size-4 rounded-full border border-white/60 bg-gradient-to-b ${DOT[item.tone]}`}
                />
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none">
                <span
                  className={`relative grid size-12 shrink-0 place-items-center rounded-2xl border border-white/40 bg-gradient-to-b ${TILE[item.tone]}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="relative z-10 size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    {ICONS[item.icon]}
                  </svg>
                  {/* glossy highlight */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-[14%] top-[6%] h-[34%] rounded-xl bg-gradient-to-b from-white/45 to-transparent"
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight text-neutral-900 sm:text-base">
                    {item.title}
                  </p>
                  <p
                    className={`mt-0.5 text-xs font-medium sm:text-sm ${DETAIL[item.tone]}`}
                  >
                    {item.detail}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
