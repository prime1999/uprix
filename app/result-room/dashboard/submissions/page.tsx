"use client";

import { useState } from "react";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  RefreshCw,
} from "lucide-react";

import GeneralButton from "@/components/miscelleneous/generalButton";
import {
  useResultRoomSubmissionHistory,
  type ResultRoomSubmissionHistoryItem,
} from "@/lib/queries/result-room";

// Adjust this path to wherever you keep icon-3d.tsx.
import { Icon3D } from "@/components/result-room/dashboard/fines/icon-3d";
import SubmissionDetailsDialog from "@/components/result-room/dashboard/submissions/submission-details-dialog";
import {
  GLASS,
  OUTLINE_BUTTON,
  cloudinaryImage,
  formatLongDay,
  formatTime,
  plural,
  statusVisual,
} from "@/components/result-room/dashboard/submissions/submission-utils";

const PAGE_SIZE = 10;
const MAX_THUMBS = 3;

interface SubmissionsPageProps {
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function SubmissionsPage({
  className = "",
}: SubmissionsPageProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useResultRoomSubmissionHistory(page, PAGE_SIZE);

  // Keep the whole item so the dialog still works after paging away.
  const [selected, setSelected] =
    useState<ResultRoomSubmissionHistoryItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const submissions = data?.submissions ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;

  const openSubmission = (submission: ResultRoomSubmissionHistoryItem) => {
    setSelected(submission);
    setDialogOpen(true);
  };

  const changePage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`mx-auto w-full max-w-3xl space-y-6 ${className}`}>
      {/* Summary */}
      <section
        aria-label="Submission summary"
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
              Your submissions
            </h1>
            <p className="mt-1 text-4xl font-semibold tabular-nums tracking-normal sm:text-5xl">
              {total}
            </p>
            <p className="mt-2 text-sm text-white/80">
              {total === 0
                ? "You haven't submitted anything yet."
                : page === 1 && submissions[0]
                  ? `Latest: ${formatLongDay(submissions[0].submission_date)}`
                  : `Showing page ${page} of ${pagination?.totalPages ?? 1}`}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          aria-label="Refresh submissions"
          className="mb-1 flex size-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40 disabled:opacity-60"
        >
          <RefreshCw
            className={`size-4 ${isRefetching ? "animate-spin" : ""}`}
          />
        </button>
      </section>

      {/* List */}
      <section aria-label="Submission history">
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
              We couldn&apos;t load your submissions.
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
        ) : submissions.length === 0 ? (
          <div
            className={`flex flex-col items-center rounded-2xl px-6 py-14 text-center ${GLASS}`}
          >
            <Icon3D icon={ImagePlus} tone="blue" size="xl" />
            <p className="mt-5 text-sm font-semibold text-neutral-900">
              No submissions yet.
            </p>
            <p className="mt-1 max-w-xs text-sm text-neutral-600">
              Once you submit your evidence for the day, it will show up here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onOpen={() => openSubmission(submission)}
              />
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

      <SubmissionDetailsDialog
        submission={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

function SubmissionCard({
  submission,
  onOpen,
}: {
  submission: ResultRoomSubmissionHistoryItem;
  onOpen: () => void;
}) {
  const status = statusVisual(submission.status);
  const description = submission.description?.trim();
  const files = submission.files;
  const extra = files.length - MAX_THUMBS;

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View submission for ${formatLongDay(submission.submission_date)}`}
        className={`group block w-full rounded-2xl p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 sm:p-5 ${GLASS}`}
      >
        <div className="flex items-start gap-3">
          <Icon3D icon={status.icon} tone={status.tone} size="md" />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold leading-snug text-neutral-900">
                {formatLongDay(submission.submission_date)}
              </h2>
              <ChevronRight
                aria-hidden
                className="mt-1 size-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600"
              />
            </div>

            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span
                className={`inline-flex items-center gap-1.5 font-medium ${status.text}`}
              >
                <span
                  aria-hidden
                  className={`size-2 rounded-full ${status.dot}`}
                />
                {status.label}
              </span>
              <span className="text-neutral-600">
                Submitted at {formatTime(submission.submitted_at)}
              </span>
            </p>

            <p
              className={`mt-2 line-clamp-2 break-words text-sm leading-relaxed ${
                description ? "text-neutral-700" : "text-neutral-500"
              }`}
            >
              {description || "No description added."}
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-4 flex items-center gap-3 border-t border-white/60 pt-4">
            <div className="flex items-center gap-2">
              {files.slice(0, MAX_THUMBS).map((file, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={file.id}
                  src={cloudinaryImage(
                    file.cloudinary_url,
                    "f_auto,q_auto,w_160,h_160,c_fill",
                  )}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="size-12 rounded-xl border-2 border-white/80 object-cover shadow-[0_8px_18px_-8px_rgba(60,70,160,0.45)] sm:size-14"
                  style={{ transform: `rotate(${(i - 1) * 2}deg)` }}
                />
              ))}

              {extra > 0 && (
                <span className="flex size-12 items-center justify-center rounded-xl border border-white/70 bg-white/50 text-xs font-semibold text-neutral-700 backdrop-blur-md sm:size-14">
                  +{extra}
                </span>
              )}
            </div>

            <span className="text-xs text-neutral-600">
              {plural(files.length, "image")}
            </span>
          </div>
        )}
      </button>
    </li>
  );
}
