"use client";

import { ClipboardCheck, Loader2 } from "lucide-react";

interface SubmitReportUploadingProps {
  message?: string;
}

export default function SubmitReportUploading({
  message = "Recording your partner report...",
}: SubmitReportUploadingProps) {
  return (
    <div className="w-full space-y-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight text-neutral-950">
          Submitting partner report
        </h3>
        <p className="text-sm leading-relaxed text-neutral-500">
          Please wait while we record your report.
        </p>
      </div>

      <div className="rounded-2xl border border-white/60 bg-white/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_-8px_rgba(60,70,160,0.25)] backdrop-blur-xl sm:p-6">
        <div className="flex items-center gap-4">
          <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-400/80 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 text-white shadow-sm">
            <span
              aria-hidden
              className="absolute inset-x-1.5 top-0.5 h-1/2 rounded-lg bg-gradient-to-b from-white/50 to-transparent"
            />
            <ClipboardCheck className="relative size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p
              role="status"
              aria-live="polite"
              className="text-sm font-semibold text-neutral-900"
            >
              {message}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Verifying and saving your report
            </p>
          </div>

          <Loader2 className="size-5 shrink-0 animate-spin text-blue-600" />
        </div>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-blue-100">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-blue-500" />
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-neutral-500">
          Please keep this page open until the request finishes.
        </p>
      </div>
    </div>
  );
}
