import type { LucideIcon } from "lucide-react";

export type Tone = "blue" | "amber" | "emerald" | "red" | "violet" | "slate";

const TONES: Record<Tone, string> = {
  blue: "border-blue-400/80 from-blue-300 via-blue-500 to-blue-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_rgba(30,64,175,0.35),0_6px_12px_-4px_rgba(59,130,246,0.65)]",
  amber:
    "border-amber-300/80 from-amber-200 via-amber-400 to-amber-500 shadow-[inset_0_2px_0_rgba(255,255,255,0.55),inset_0_-3px_0_rgba(146,64,14,0.35),0_6px_12px_-4px_rgba(245,158,11,0.65)]",
  emerald:
    "border-emerald-400/80 from-emerald-300 via-emerald-500 to-emerald-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_rgba(6,78,59,0.35),0_6px_12px_-4px_rgba(16,185,129,0.65)]",
  red: "border-red-400/80 from-red-300 via-red-500 to-red-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_rgba(127,29,29,0.35),0_6px_12px_-4px_rgba(239,68,68,0.65)]",
  violet:
    "border-violet-400/80 from-violet-300 via-violet-500 to-violet-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_rgba(76,29,149,0.35),0_6px_12px_-4px_rgba(139,92,246,0.65)]",
  slate:
    "border-slate-400/80 from-slate-300 via-slate-500 to-slate-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.45),inset_0_-3px_0_rgba(15,23,42,0.35),0_6px_12px_-4px_rgba(71,85,105,0.55)]",
};

const ICON_SIZES = {
  sm: { box: "size-9 rounded-xl", icon: "size-4" },
  md: { box: "size-11 rounded-xl", icon: "size-5" },
  lg: { box: "size-12 rounded-2xl", icon: "size-6" },
  xl: { box: "size-16 rounded-3xl", icon: "size-8" },
} as const;

export type IconSize = keyof typeof ICON_SIZES;

/** A raised, glossy icon tile: top highlight, darker bottom edge, soft drop shadow. */
export function Icon3D({
  icon: Icon,
  tone = "blue",
  size = "md",
  spin = false,
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: IconSize;
  /** Spin the icon (use with Loader2). */
  spin?: boolean;
}) {
  const s = ICON_SIZES[size];

  return (
    <span
      aria-hidden
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border bg-gradient-to-b text-white ${s.box} ${TONES[tone]}`}
    >
      <span className="pointer-events-none absolute inset-x-2 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/55 to-transparent" />
      <Icon
        className={`relative drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.35)] ${s.icon} ${
          spin ? "animate-spin" : ""
        }`}
        strokeWidth={2.25}
      />
    </span>
  );
}
