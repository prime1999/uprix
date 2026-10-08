"use client";

import { ArrowRight, Check, ImageIcon } from "lucide-react";

interface SubmissionSuccessProps {
  /** Number of evidence images submitted. */
  imageCount?: number;

  /** Optional description that was submitted. */
  description?: string;

  /** Called when the user wants to continue. */
  onContinue?: () => void;

  /** Optional custom heading. */
  title?: string;

  /** Optional custom message. */
  message?: string;

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

export default function SubmissionSuccess({
  imageCount = 1,
  description,
  onContinue,
  title = "Evidence submitted",
  message = "Your work for today has been recorded successfully.",
  withBackdrop = true,
}: SubmissionSuccessProps) {
  const note = description?.trim();

  return (
    <div className={`relative w-full space-y-5`}>
      {/* soft colour blobs the glass can frost */}
      {withBackdrop && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="ss-drift absolute -left-10 -top-10 size-56 rounded-full bg-blue-300/60 blur-3xl" />
          <div className="absolute -bottom-12 -right-10 size-64 rounded-full bg-violet-300/60 blur-3xl" />
          <div className="absolute left-1/2 top-1/3 size-40 -translate-x-1/2 rounded-full bg-emerald-200/50 blur-3xl" />
        </div>
      )}

      {/* Header */}
      <div className="space-y-1">
        <h6 className="text-base font-semibold tracking-tight text-neutral-950 sm:text-md">
          Welldone! 👍
        </h6>

        <p className="text-xs leading-relaxed text-neutral-600">
          Your daily accountability is up to date.
        </p>
      </div>

      {/* Success card (a status region, so screen readers announce it) */}
      <div
        role="status"
        aria-live="polite"
        className={`overflow-hidden rounded-2xl ring-1 ring-emerald-300/40 ${GLASS}`}
      >
        <div className="p-5 sm:p-6">
          {/* Success indicator */}
          <div className="flex items-start gap-4">
            {/* 3D green tile with a one-time glow ring */}
            <div className="ss-pop relative size-11 shrink-0">
              <span
                aria-hidden
                className="ss-ring absolute inset-0 rounded-xl bg-emerald-400/50"
              />
              <span className="relative flex size-full items-center justify-center overflow-hidden rounded-xl border border-emerald-400/80 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(16,185,129,0.6)]">
                {/* glossy highlight on the top half */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-1.5 top-0.5 h-1/2 rounded-lg bg-gradient-to-b from-white/50 to-transparent"
                />
                <Check className="ss-check relative size-5" strokeWidth={3} />
              </span>
            </div>

            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-neutral-950">
                {title}
              </h4>

              <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                {message}
              </p>
            </div>
          </div>

          {/* Submission details */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div
              className={`ss-in rounded-xl px-3.5 py-3 ${GLASS_INNER}`}
              style={{ animationDelay: "250ms" }}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 text-blue-500" />

                <span className="text-xs font-medium text-neutral-600">
                  Evidence
                </span>
              </div>

              <p className="mt-1.5 text-sm font-semibold text-neutral-900">
                {imageCount === 1 ? "1 image" : `${imageCount} images`}
              </p>
            </div>

            <div
              className={`ss-in rounded-xl px-3.5 py-3 ${GLASS_INNER}`}
              style={{ animationDelay: "350ms" }}
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />

                <span className="text-xs font-medium text-neutral-600">
                  Status
                </span>
              </div>

              {/* small 3D green pill */}
              <span className="mt-1.5 inline-flex rounded-full border border-emerald-400/80 bg-gradient-to-b from-emerald-400 to-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_6px_-1px_rgba(16,185,129,0.5)]">
                Submitted
              </span>
            </div>
          </div>

          {/* Description preview */}
          {note && (
            <div
              className={`ss-in mt-4 rounded-xl px-3.5 py-3 ${GLASS_INNER}`}
              style={{ animationDelay: "450ms" }}
            >
              <p className="text-xs font-medium text-neutral-600">Your note</p>

              <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-800">
                {note}
              </p>
            </div>
          )}

          {/* Background storage note */}
          <div className="ss-in mt-4" style={{ animationDelay: "550ms" }}>
            <p className="text-xs leading-relaxed text-blue-900/80 font-semibold">
              Your evidence is being securely processed in the background. Maybe
              check up on your partner's Submission.
            </p>
          </div>
        </div>

        {/* Continue action */}
        {onContinue && (
          <div className="border-t border-white/60 bg-white/30 px-5 py-3.5 backdrop-blur-md sm:px-6">
            {/* 3D blue button */}
            <button
              type="button"
              onClick={onContinue}
              className="group relative inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-blue-400/80 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 px-4 text-sm font-semibold text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(59,130,246,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_12px_22px_-6px_rgba(59,130,246,0.7)] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 active:translate-y-0.5 active:shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_3px_8px_-3px_rgba(59,130,246,0.5)]"
            >
              {/* glossy highlight on the top half */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-[10%] top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/50 to-transparent"
              />
              {/* light sweep on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-white/30 transition-transform duration-700 group-hover:translate-x-[400%]"
              />
              <span className="relative inline-flex items-center gap-2">
                Continue
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
