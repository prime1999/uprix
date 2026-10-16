import {
  AlertCircle,
  BadgeCheck,
  ClipboardCheck,
  Clock,
  type LucideIcon,
} from "lucide-react";

// Adjust this path to wherever you keep icon-3d.tsx.
import type { Tone } from "../fines/icon-3d";

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

export const GLASS =
  "border border-white/60 bg-white/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_-8px_rgba(60,70,160,0.25)]";

export const GLASS_INNER =
  "border border-white/70 bg-white/30 backdrop-blur-md";

export const OUTLINE_BUTTON =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-neutral-300 bg-white/70 px-5 py-2.5 text-xs font-bold text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

/* -------------------------------------------------------------------------- */
/* Formatting                                                                 */
/* -------------------------------------------------------------------------- */

export const humanize = (value: string | null | undefined) => {
  if (!value) return "";
  const text = value.replace(/[_-]+/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** submission_date is a plain DATE (YYYY-MM-DD). Parse it as a local day so it never shifts. */
const parseDay = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const formatLongDay = (value: string) =>
  parseDay(value).toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const formatShortDay = (value: string) =>
  parseDay(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });

export const formatDateTime = (iso: string) =>
  `${new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}, ${formatTime(iso)}`;

export const plural = (n: number, word: string) =>
  `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * Ask Cloudinary for a smaller, optimised version of an image.
 * e.g. cloudinaryImage(url, "f_auto,q_auto,w_600")
 */
export const cloudinaryImage = (url: string, transform: string) =>
  url.includes("/upload/")
    ? url.replace("/upload/", `/upload/${transform}/`)
    : url;

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

export interface StatusVisual {
  label: string;
  icon: LucideIcon;
  tone: Tone;
  dot: string;
  text: string;
}

/** Submissions default to SUBMITTED; the other cases cover common review states. */
export function statusVisual(status: string): StatusVisual {
  const value = status.toUpperCase();

  if (["APPROVED", "VERIFIED", "ACCEPTED"].includes(value)) {
    return {
      label: humanize(status),
      icon: BadgeCheck,
      tone: "emerald",
      dot: "bg-emerald-500",
      text: "text-emerald-800",
    };
  }

  if (["REJECTED", "FLAGGED", "INVALID"].includes(value)) {
    return {
      label: humanize(status),
      icon: AlertCircle,
      tone: "red",
      dot: "bg-red-500",
      text: "text-red-700",
    };
  }

  if (["PENDING", "UNDER_REVIEW", "IN_REVIEW", "LATE"].includes(value)) {
    return {
      label: humanize(status),
      icon: Clock,
      tone: "amber",
      dot: "bg-amber-500",
      text: "text-amber-800",
    };
  }

  return {
    label: humanize(status) || "Submitted",
    icon: ClipboardCheck,
    tone: "blue",
    dot: "bg-blue-500",
    text: "text-blue-800",
  };
}

/** How a Google Drive backup is going, in plain words. */
export function driveVisual(status: string) {
  const value = status.toUpperCase();

  if (["UPLOADED", "SUCCESS", "COMPLETED", "DONE", "SYNCED"].includes(value)) {
    return {
      label: "Saved to Drive",
      dot: "bg-emerald-500",
      text: "text-emerald-800",
    };
  }

  if (["FAILED", "ERROR"].includes(value)) {
    return {
      label: "Drive backup failed",
      dot: "bg-red-500",
      text: "text-red-700",
    };
  }

  return {
    label: "Drive backup pending",
    dot: "bg-amber-500",
    text: "text-amber-800",
  };
}
