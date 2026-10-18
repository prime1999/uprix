"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  LoaderCircle,
  MessageSquare,
  X,
} from "lucide-react";

import GeneralButton from "@/components/miscelleneous/generalButton";
import { useResultRoomTodayPartnerReport } from "@/lib/queries/result-room";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface PartnerReportViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

/* -------------------------------------------------------------------------- */
/* Formatting helpers                                                         */
/* -------------------------------------------------------------------------- */

function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* -------------------------------------------------------------------------- */
/* Design tokens (same look as SubmissionViewModal)                           */
/* -------------------------------------------------------------------------- */

const GLASS_INNER = "border border-white/70 bg-white/40 backdrop-blur-md";

function Tile3D({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "red" | "emerald";
}) {
  const palette = {
    blue: "border-blue-400/80 from-blue-400 via-blue-500 to-blue-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(59,130,246,0.6)]",
    red: "border-red-400/80 from-red-400 via-red-500 to-red-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(239,68,68,0.6)]",
    emerald:
      "border-emerald-400/80 from-emerald-400 via-emerald-500 to-emerald-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(16,185,129,0.6)]",
  }[tone];

  return (
    <span
      className={`relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-b text-white ${palette}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-1.5 top-0.5 h-1/2 rounded-xl bg-gradient-to-b from-white/50 to-transparent"
      />
      <span className="relative">{children}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function PartnerReportViewModal({
  isOpen,
  onClose,
  title = "Your partner report",
  description = "The report you submitted about your partner today.",
}: PartnerReportViewModalProps) {
  const dialogRef = useRef<HTMLElement>(null);

  // Only fetches while the modal is open.
  const { data, isLoading, isError, error, refetch } =
    useResultRoomTodayPartnerReport(isOpen);

  const report = data?.report ?? null;
  const dateLabel = data?.date ? formatDate(data.date) : "";

  // Move focus into the dialog when it opens.
  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Lock page scroll while open.
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const onTime = report?.submitted_on_time ?? false;
  const comment = report?.comment?.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-report-modal-title"
        className="sv-in relative isolate flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 shadow-2xl outline-none sm:rounded-3xl"
      >
        {/* Soft colour blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="sv-drift absolute -left-10 -top-10 size-56 rounded-full bg-blue-300/60 blur-3xl" />
          <div className="absolute -bottom-12 -right-10 size-64 rounded-full bg-violet-300/60 blur-3xl" />
          <div className="absolute left-1/2 top-1/3 size-40 -translate-x-1/2 rounded-full bg-cyan-200/50 blur-3xl" />
        </div>

        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b border-white/60 bg-white/30 px-5 py-4 backdrop-blur-xl">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold tracking-wide text-neutral-600">
              <ClipboardCheck className="size-4 text-blue-500" />
              <span>RESULT ROOM</span>
            </div>

            <h2
              id="partner-report-modal-title"
              className="text-lg font-heading font-semibold tracking-tight text-secondary-blue"
            >
              {title}
            </h2>

            <p className="mt-1 text-sm text-neutral-600">{description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close partner report modal"
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-neutral-600 transition-all hover:-translate-y-0.5 hover:bg-white/70 hover:text-neutral-950 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/30 ${GLASS_INNER}`}
          >
            <X className="size-4" />
          </button>
        </header>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 text-center">
              <Tile3D>
                <LoaderCircle className="size-6 animate-spin" />
              </Tile3D>

              <p className="text-sm font-medium text-neutral-700">
                Loading your report...
              </p>
            </div>
          ) : isError ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4">
                <Tile3D tone="red">
                  <AlertCircle className="size-6" />
                </Tile3D>
              </div>

              <h3 className="font-semibold text-neutral-950">
                Could not load your report
              </h3>

              <p className="mt-2 max-w-md text-sm text-neutral-600">
                {error instanceof Error
                  ? error.message
                  : "Something went wrong while loading this report."}
              </p>

              <div className="mt-5">
                <GeneralButton
                  text="Try again"
                  variant="active"
                  buttonFunction={() => void refetch()}
                />
              </div>
            </div>
          ) : !report ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <span
                className={`mb-4 flex size-14 items-center justify-center rounded-2xl ${GLASS_INNER} shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]`}
              >
                <ClipboardCheck className="size-6 text-neutral-500" />
              </span>

              <h3 className="font-semibold text-neutral-950">
                No report found
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-600">
                We couldn&apos;t find a partner report from you for today.
              </p>

              {dateLabel && (
                <p className="mt-3 text-xs text-neutral-500">{dateLabel}</p>
              )}
            </div>
          ) : (
            <div className="space-y-6 p-5">
              {/* Verdict */}
              <div
                className={`flex items-center gap-3 rounded-2xl p-4 ${GLASS_INNER}`}
              >
                <Tile3D tone={onTime ? "emerald" : "red"}>
                  {onTime ? (
                    <CheckCircle2 className="size-6" />
                  ) : (
                    <Clock3 className="size-6" />
                  )}
                </Tile3D>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-600">
                    Your verdict
                  </p>
                  <p
                    className={`text-base font-semibold ${
                      onTime ? "text-emerald-800" : "text-red-700"
                    }`}
                  >
                    {onTime ? "Partner was on time" : "Partner was late"}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl p-4 ${GLASS_INNER}`}>
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
                    <CalendarDays className="size-4 text-blue-500" />
                    Report date
                  </div>

                  <p className="mt-2 text-sm font-semibold text-neutral-900">
                    {formatDate(report.review_date)}
                  </p>
                </div>

                <div className={`rounded-xl p-4 ${GLASS_INNER}`}>
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
                    <Clock3 className="size-4 text-blue-500" />
                    Reported at
                  </div>

                  <p className="mt-2 text-sm font-semibold text-neutral-900">
                    {formatDateTime(report.reviewed_at)}
                  </p>
                </div>
              </div>

              {/* Comment */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
                  <MessageSquare className="size-4 text-blue-500" />
                  Your comment
                </h3>

                {comment ? (
                  <div
                    className={`whitespace-pre-wrap break-words rounded-xl p-4 text-sm leading-7 text-neutral-800 ${GLASS_INNER}`}
                  >
                    {comment}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-blue-300/80 bg-white/30 p-4 text-sm text-neutral-600 backdrop-blur-md">
                    No comment was added.
                  </p>
                )}
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-3 border-t border-white/60 bg-white/30 px-5 py-4 backdrop-blur-xl">
          <p className="text-xs text-neutral-600">{dateLabel}</p>

          <GeneralButton
            text="Close"
            variant="active"
            buttonFunction={onClose}
          />
        </footer>
      </section>
    </div>
  );
}
