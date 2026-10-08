"use client";

import { CloudUpload } from "lucide-react";

interface SubmissionUploadingProps {
  /** Current Cloudinary upload progress: 0–100. */
  progress?: number;

  /** Number of images currently being uploaded. */
  imageCount?: number;

  /** Optional custom message. */
  message?: string;
}

// shared 3D blue fill: gradient, top highlight line, soft glow, no dark edge
const BLUE_3D =
  "bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_6px_rgba(59,130,246,0.55)]";

export default function SubmissionUploading({
  progress,
  imageCount = 1,
  message = "Uploading your evidence...",
}: SubmissionUploadingProps) {
  const hasProgress = typeof progress === "number" && Number.isFinite(progress);

  const safeProgress = hasProgress ? Math.min(100, Math.max(0, progress)) : 0;
  const finishing = hasProgress && safeProgress >= 100;

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <h6 className="text-base font-semibold tracking-tight text-neutral-950 sm:text-sm">
          Submitting today&apos;s work
        </h6>
        <p className="text-xs leading-relaxed text-neutral-500">
          Your evidence is being uploaded securely.
        </p>
      </div>

      {/* Upload card */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-transparent backdrop-blur-3xl shadow-[0_1px_2px_rgba(16,18,40,0.04),0_12px_32px_-18px_rgba(16,18,40,0.16)]">
        <div className="p-5 sm:p-6">
          {/* Upload icon + status */}
          <div className="flex items-center gap-4">
            {/* 3D blue tile with a pulsing glow ring behind it */}
            <div className="relative size-11 shrink-0">
              <span
                aria-hidden
                className="absolute inset-0 rounded-xl bg-blue-400/40 motion-safe:animate-ping"
              />
              <span className="relative flex size-full items-center justify-center overflow-hidden rounded-xl border border-blue-400/80 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(59,130,246,0.6)]">
                {/* glossy highlight on the top half */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-1.5 top-0.5 h-1/2 rounded-lg bg-gradient-to-b from-white/50 to-transparent"
                />
                <CloudUpload className="su-bob relative size-5" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p
                role="status"
                className="text-sm font-semibold text-neutral-900"
              >
                {message}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                {imageCount === 1 ? "1 image" : `${imageCount} images`}{" "}
                {hasProgress
                  ? finishing
                    ? "· Finishing up"
                    : "· Upload in progress"
                  : "· Preparing upload"}
              </p>
            </div>

            {hasProgress && (
              <span className="shrink-0 rounded-full border border-blue-400/80 bg-gradient-to-b from-blue-400 to-blue-600 px-2.5 py-0.5 text-xs font-bold tabular-nums text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_6px_-1px_rgba(59,130,246,0.5)]">
                {Math.round(safeProgress)}%
              </span>
            )}
          </div>

          {/* Progress: a groove pressed into the card with a glossy blue fill */}
          <div className="mt-6">
            <div
              className="h-3 w-full overflow-hidden rounded-full border border-blue-200/80 bg-gradient-to-b from-blue-100 to-blue-50 p-[2px] shadow-[inset_0_2px_4px_rgba(30,64,175,0.22)]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={hasProgress ? Math.round(safeProgress) : undefined}
              aria-label="Evidence upload progress"
            >
              {hasProgress ? (
                <div
                  className={`relative h-full overflow-hidden rounded-full transition-[width] duration-300 ease-out ${BLUE_3D}`}
                  style={{ width: `${safeProgress}%` }}
                >
                  {/* glossy highlight on the top half */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-1 top-px h-1/2 rounded-full bg-gradient-to-b from-white/60 to-transparent"
                  />
                  {/* moving shine while the upload runs */}
                  {!finishing && (
                    <span
                      aria-hidden
                      className="su-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/35"
                    />
                  )}
                </div>
              ) : (
                // unknown progress: a 3D pill slides back and forth
                <div className="h-full w-full overflow-hidden rounded-full">
                  <div
                    className={`su-slide relative h-full w-1/3 rounded-full ${BLUE_3D}`}
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-1 top-px h-1/2 rounded-full bg-gradient-to-b from-white/60 to-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Information */}
          <div className="mt-4">
            <p className="text-center text-xs leading-relaxed text-neutral-500">
              Please keep this page open while your evidence is being uploaded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
