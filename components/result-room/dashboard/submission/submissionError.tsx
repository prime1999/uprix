"use client";

import { AlertCircle, ImageIcon, RefreshCw } from "lucide-react";

interface SubmissionErrorProps {
  /** Error message to show the participant. */
  message?: string;

  /** Number of images that were being submitted. */
  imageCount?: number;

  /** Called when the participant wants to try again. */
  onRetry?: () => void;

  /** Called when the participant wants to go back. */
  onCancel?: () => void;

  /** Prevents interaction while a retry is being prepared. */
  retrying?: boolean;

  /**
   * Paint a soft gradient behind the glass so the blur has something to frost.
   * Turn off when this already sits on a coloured or image background.
   */
  withBackdrop?: boolean;
}

// frosted panel: translucent white, blur, light border, bright top edge
const GLASS =
  "border border-white/60 bg-white/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_-8px_rgba(60,70,160,0.25)]";

// smaller frosted surface used inside the panel
const GLASS_INNER = "border border-white/70 bg-white/40 backdrop-blur-md";

export default function SubmissionError({
  message = "We couldn't submit your evidence. Please try again.",
  imageCount = 1,
  onRetry,
  onCancel,
  retrying = false,
  withBackdrop = true,
}: SubmissionErrorProps) {
  const hasActions = Boolean(onRetry || onCancel);

  return (
    <div className={`relative w-full space-y-5`}>
      {/* soft colour blobs the glass can frost */}
      {withBackdrop && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="se-drift absolute -left-10 -top-10 size-56 rounded-full bg-blue-300/60 blur-3xl" />
          <div className="absolute -bottom-12 -right-10 size-64 rounded-full bg-violet-300/60 blur-3xl" />
          <div className="absolute left-1/2 top-1/3 size-40 -translate-x-1/2 rounded-full bg-rose-200/50 blur-3xl" />
        </div>
      )}

      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight text-neutral-950 sm:text-lg">
          Today&apos;s Work
        </h3>

        <p className="text-sm leading-relaxed text-neutral-600">
          Something went wrong while submitting your evidence.
        </p>
      </div>

      {/* Error card (an alert, so screen readers announce it right away) */}
      <div className={`overflow-hidden rounded-2xl ${GLASS}`}>
        <div className="p-5 sm:p-6">
          {/* Error indicator */}
          <div className="flex items-start gap-4">
            {/* 3D red tile: pops in, then shakes once with a glow ring */}
            <div className="se-pop relative size-11 shrink-0">
              <span
                aria-hidden
                className="se-ring absolute inset-0 rounded-xl bg-rose-400/50"
              />
              <span className="se-shake relative flex size-full items-center justify-center overflow-hidden rounded-xl border border-red-400/80 bg-gradient-to-b from-red-400 via-red-500 to-red-600 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(239,68,68,0.6)]">
                {/* glossy highlight on the top half */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-1.5 top-0.5 h-1/2 rounded-lg bg-gradient-to-b from-white/50 to-transparent"
                />
                <AlertCircle className="relative size-5" strokeWidth={2.25} />
              </span>
            </div>

            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-neutral-950">
                Submission failed
              </h4>

              <p className="mt-1 break-words text-sm leading-relaxed text-neutral-600">
                {message}
              </p>
            </div>
          </div>

          {/* Details */}
          <div
            className={`se-in mt-5 rounded-xl px-3.5 py-3 ${GLASS_INNER}`}
            style={{ animationDelay: "250ms" }}
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="size-4 text-neutral-500" />

              <span className="text-xs font-medium text-neutral-600">
                Evidence
              </span>
            </div>

            <p className="mt-1.5 text-sm font-semibold text-neutral-900">
              {imageCount === 1 ? "1 image" : `${imageCount} images`}
            </p>
          </div>

          {/* Helpful message */}
          <div
            className="se-in mt-4 bg-red-500 text-white p-2 rounded-md"
            style={{ animationDelay: "350ms" }}
          >
            <p className="text-xs leading-relaxed">
              Your evidence has not been marked as submitted. Check your
              connection and try again.
            </p>
          </div>
        </div>

        {/* Actions (only rendered when there is something to click) */}
        {hasActions && (
          <div className="flex flex-col-reverse gap-2 border-t border-white/60 bg-white/30 p-4 backdrop-blur-md sm:flex-row sm:justify-end sm:px-5">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={retrying}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/70 bg-white/50 px-5 text-sm font-medium text-neutral-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_-4px_rgba(60,70,160,0.2)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/75 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                Go back
              </button>
            )}

            {onRetry && (
              // 3D blue button
              <button
                type="button"
                onClick={onRetry}
                disabled={retrying}
                className="group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl border border-blue-400/80 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 px-5 text-sm font-semibold text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(59,130,246,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_12px_22px_-6px_rgba(59,130,246,0.7)] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 active:translate-y-0.5 active:shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_3px_8px_-3px_rgba(59,130,246,0.5)] disabled:cursor-not-allowed disabled:opacity-60 disabled:saturate-50 disabled:hover:translate-y-0 disabled:hover:brightness-100"
              >
                {/* glossy highlight on the top half */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-[10%] top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/50 to-transparent"
                />
                {/* light sweep on hover */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-white/30 transition-transform duration-700 group-hover:translate-x-[400%] group-disabled:hidden"
                />
                <span className="relative inline-flex items-center gap-2">
                  <RefreshCw
                    className={`size-4 ${retrying ? "animate-spin" : ""}`}
                  />
                  {retrying ? "Retrying..." : "Try again"}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
