"use client";

import { useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  RefreshCw,
} from "lucide-react";

import GeneralButton from "@/components/miscelleneous/generalButton";
import {
  useResultRoomPartnerReportHistory,
  type PartnerReportHistoryItem,
} from "@/lib/queries/result-room";

// Adjust this path to wherever you keep icon-3d.tsx.
import { Icon3D } from "@/components/result-room/dashboard/fines/icon-3d";
import {
  GLASS,
  OUTLINE_BUTTON,
  formatLongDay,
  formatTime,
} from "@/components/result-room/dashboard/submissions/submission-utils";

const PAGE_SIZE = 10;

interface ReportsPageProps {
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ReportsPage({ className = "" }: ReportsPageProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useResultRoomPartnerReportHistory(page, PAGE_SIZE);

  const reports = data?.reports ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;

  const changePage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`mx-auto w-full max-w-3xl space-y-6 ${className}`}>
      {/* Summary */}
      <section
        aria-label="Partner report summary"
        className="flex items-end justify-between gap-4 rounded-2xl bg-secondary-blue px-5 py-6 text-white sm:px-7 sm:py-8"
      >
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-white/25" />
            <div className="h-12 w-24 animate-pulse rounded bg-white/25" />
          </div>
        ) : (
          <div>
            <h1 className="text-sm font-medium text-white/75">
              Your partner reports
            </h1>
            <p className="mt-1 text-4xl font-semibold tabular-nums tracking-normal sm:text-5xl">
              {total}
            </p>
            <p className="mt-2 text-sm text-white/80">
              {total === 0
                ? "You haven't reported on your partner yet."
                : page === 1 && reports[0]
                  ? `Latest: ${formatLongDay(reports[0].review_date)}`
                  : `Showing page ${page} of ${pagination?.totalPages ?? 1}`}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          aria-label="Refresh partner reports"
          className="mb-1 flex size-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40 disabled:opacity-60"
        >
          <RefreshCw
            className={`size-4 ${isRefetching ? "animate-spin" : ""}`}
          />
        </button>
      </section>

      {/* List */}
      <section aria-label="Partner report history">
        {isLoading ? (
          <ul aria-busy className="space-y-3">
            {[0, 1, 2, 3].map((n) => (
              <li key={n} className={`rounded-2xl p-4 sm:p-5 ${GLASS}`}>
                <div className="flex gap-3">
                  <div className="size-11 shrink-0 animate-pulse rounded-xl bg-white/70" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-white/70" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-white/50" />
                    <div className="h-3 w-full animate-pulse rounded bg-white/50" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : isError ? (
          <div className="py-14 text-center">
            <AlertCircle className="mx-auto size-6 text-red-500" />
            <p className="mt-3 text-sm font-semibold text-neutral-900">
              We couldn&apos;t load your partner reports.
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              {error instanceof Error && error.message
                ? error.message
                : "Check your connection and try again."}
            </p>
            <div className="mt-5 flex justify-center">
              <GeneralButton
                text="Try again"
                variant="active"
                buttonFunction={() => refetch()}
              />
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div
            className={`flex flex-col items-center rounded-2xl px-6 py-14 text-center ${GLASS}`}
          >
            <Icon3D icon={ClipboardCheck} tone="blue" size="xl" />
            <p className="mt-5 text-sm font-semibold text-neutral-900">
              No partner reports yet.
            </p>
            <p className="mt-1 max-w-xs text-sm text-neutral-600">
              Once you report on your partner&apos;s submission, it will show up
              here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </ul>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <nav
            aria-label="Pagination"
            className="mt-6 flex items-center justify-between gap-3"
          >
            <button
              type="button"
              onClick={() => changePage(page - 1)}
              disabled={page <= 1}
              className={OUTLINE_BUTTON}
            >
              <ChevronLeft className="size-4" />
              Previous
            </button>

            <p className="text-sm tabular-nums text-neutral-600">
              Page {pagination.page} of {pagination.totalPages}
            </p>

            <button
              type="button"
              onClick={() => changePage(page + 1)}
              disabled={!pagination.hasMore}
              className={OUTLINE_BUTTON}
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

/** Raised 3D tile: green when the partner was on time, red when late. */
function ReportIcon({ onTime }: { onTime: boolean }) {
  const Icon = onTime ? CheckCircle2 : Clock;

  return (
    <span
      aria-hidden
      className={`relative grid size-11 shrink-0 place-items-center rounded-xl border border-white/50 bg-gradient-to-b text-white ${
        onTime
          ? "from-emerald-300 to-emerald-500 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_rgba(4,120,87,0.35),0_10px_16px_-8px_rgba(16,185,129,0.8)]"
          : "from-red-300 to-red-500 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_rgba(153,27,27,0.35),0_10px_16px_-8px_rgba(239,68,68,0.8)]"
      }`}
    >
      <Icon className="relative z-10 size-5" />
      <span className="pointer-events-none absolute inset-x-[14%] top-[6%] h-[34%] rounded-lg bg-gradient-to-b from-white/45 to-transparent" />
    </span>
  );
}

function ReportCard({ report }: { report: PartnerReportHistoryItem }) {
  const onTime = report.submitted_on_time;
  const comment = report.comment?.trim();

  return (
    <li
      className={`rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none sm:p-5 ${GLASS}`}
    >
      <div className="flex items-start gap-3">
        <ReportIcon onTime={onTime} />

        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-snug text-neutral-900">
            {formatLongDay(report.review_date)}
          </h2>

          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span
              className={`inline-flex items-center gap-1.5 font-medium ${
                onTime ? "text-emerald-700" : "text-red-700"
              }`}
            >
              <span
                aria-hidden
                className={`size-2 rounded-full ${
                  onTime ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              {onTime ? "Partner was on time" : "Partner was late"}
            </span>
            <span className="text-neutral-600">
              Reported at {formatTime(report.reviewed_at)}
            </span>
          </p>

          <p
            className={`mt-2 whitespace-pre-line break-words text-sm leading-relaxed ${
              comment ? "text-neutral-700" : "text-neutral-500"
            }`}
          >
            {comment || "No comment added."}
          </p>
        </div>
      </div>
    </li>
  );
}
