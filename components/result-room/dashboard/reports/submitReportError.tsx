"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

interface SubmitReportErrorProps {
  message?: string;
  onRetry?: () => void | Promise<void>;
  onCancel?: () => void;
  retrying?: boolean;
}

export default function SubmitReportError({
  message = "We couldn't record your partner report. Please try again.",
  onRetry,
  onCancel,
  retrying = false,
}: SubmitReportErrorProps) {
  return (
    <div className="w-full space-y-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight text-neutral-950">
          Partner report
        </h3>
        <p className="text-sm leading-relaxed text-neutral-600">
          Something went wrong while submitting your report.
        </p>
      </div>

      <div
        role="alert"
        aria-live="assertive"
        className="overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_-8px_rgba(60,70,160,0.25)] backdrop-blur-xl"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-red-400/80 bg-gradient-to-b from-red-400 via-red-500 to-red-600 text-white shadow-sm">
              <AlertCircle className="size-5" />
            </span>

            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-neutral-950">
                Report submission failed
              </h4>
              <p className="mt-1 break-words text-sm leading-relaxed text-neutral-600">
                {message}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-white/70 bg-white/40 px-3.5 py-3">
            <p className="text-xs leading-relaxed text-neutral-600">
              If you are unsure whether the report was saved, check your
              partner-report status before retrying. This helps avoid submitting
              the same report twice.
            </p>
          </div>
        </div>

        {(onRetry || onCancel) && (
          <div className="flex flex-col-reverse gap-2 border-t border-white/60 bg-white/30 p-4 sm:flex-row sm:justify-end sm:px-5">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={retrying}
                className="h-11 rounded-xl border border-neutral-200 px-5 text-sm font-medium text-neutral-800 transition hover:bg-white/70 disabled:opacity-50"
              >
                Go back
              </button>
            )}

            {onRetry && (
              <button
                type="button"
                onClick={() => void onRetry()}
                disabled={retrying}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-400/80 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`size-4 ${retrying ? "animate-spin" : ""}`}
                />
                {retrying ? "Retrying..." : "Try again"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
