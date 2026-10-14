"use client";

import { ArrowRight, Check, ClipboardCheck } from "lucide-react";

interface SubmitReportSuccessProps {
  onContinue?: () => void;
  title?: string;
  message?: string;
  comment?: string;
}

export default function SubmitReportSuccess({
  onContinue,
  title = "Partner report submitted",
  message = "Your partner report has been recorded successfully.",
  comment,
}: SubmitReportSuccessProps) {
  const note = comment?.trim();

  return (
    <div className="w-full space-y-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight text-neutral-950">
          Report submitted
        </h3>
        <p className="text-sm leading-relaxed text-neutral-600">
          Your partner accountability check is complete.
        </p>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="overflow-hidden rounded-2xl border border-emerald-300/40 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_-8px_rgba(60,70,160,0.25)] backdrop-blur-xl"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/80 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 text-white shadow-sm">
              <Check className="size-5" strokeWidth={3} />
            </span>

            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-neutral-950">
                {title}
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                {message}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-white/70 bg-white/40 px-3.5 py-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="size-4 text-emerald-600" />
              <span className="text-xs font-medium text-neutral-600">
                Report status
              </span>
            </div>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Submitted
            </span>
          </div>

          {note && (
            <div className="mt-4 rounded-xl border border-white/70 bg-white/40 px-3.5 py-3">
              <p className="text-xs font-medium text-neutral-600">
                Your comment
              </p>
              <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-800">
                {note}
              </p>
            </div>
          )}

          <p className="mt-4 text-xs leading-relaxed text-neutral-600">
            Thank you for completing your partner accountability check.
          </p>
        </div>

        {onContinue && (
          <div className="border-t border-white/60 bg-white/30 px-5 py-3.5">
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-400/80 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Continue
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
