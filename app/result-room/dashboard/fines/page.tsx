"use client";

import { useState } from "react";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Info,
  RefreshCw,
  StickyNote,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import GeneralButton from "@/components/miscelleneous/generalButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useResultRoomPartnerReportHistory,
  type PartnerReportDirection,
  type PartnerReportHistoryItem,
} from "@/lib/queries/result-room";

// Adjust these paths to match your project.
import {
  Icon3D,
  type Tone,
} from "@/components/result-room/dashboard/fines/icon-3d";
import {
  GLASS,
  OUTLINE_BUTTON,
  formatLongDay,
  formatTime,
} from "@/components/result-room/dashboard/submissions/submission-utils";

const PAGE_SIZE = 10;

const GLASS_INNER = "border border-white/70 bg-white/30 backdrop-blur-md";

/* -------------------------------------------------------------------------- */
/* Copy for the two tabs                                                      */
/* -------------------------------------------------------------------------- */

const TABS: { id: PartnerReportDirection; label: string }[] = [
  { id: "made", label: "My reports" },
  { id: "received", label: "From my partner" },
];

const COPY: Record<
  PartnerReportDirection,
  {
    heading: string;
    emptySummary: string;
    emptyTitle: string;
    emptyBody: string;
    onTime: string;
    late: string;
    by: string;
    noComment: string;
  }
> = {
  made: {
    heading: "Reports you made",
    emptySummary: "You haven't reported on your partner yet.",
    emptyTitle: "No partner reports yet.",
    emptyBody:
      "Once you report on your partner's submission, it will show up here.",
    onTime: "Partner was on time",
    late: "Partner was late",
    by: "You",
    noComment: "No comment added.",
  },
  received: {
    heading: "Reports about you",
    emptySummary: "Your partner hasn't reported on you yet.",
    emptyTitle: "Nothing from your partner yet.",
    emptyBody:
      "When your partner reports on your submissions, their reports will show up here.",
    onTime: "You were on time",
    late: "You were late",
    by: "Your partner",
    noComment: "Your partner didn't leave a comment.",
  },
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

interface ReportsPageProps {
  className?: string;
}

interface SelectedReport {
  report: PartnerReportHistoryItem;
  direction: PartnerReportDirection;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ReportsPage({ className = "" }: ReportsPageProps) {
  const [direction, setDirection] = useState<PartnerReportDirection>("made");

  // Each tab remembers its own page.
  const [pages, setPages] = useState<Record<PartnerReportDirection, number>>({
    made: 1,
    received: 1,
  });

  // Both lists load so each tab can show its count.
  const made = useResultRoomPartnerReportHistory(pages.made, PAGE_SIZE, "made");
  const received = useResultRoomPartnerReportHistory(
    pages.received,
    PAGE_SIZE,
    "received",
  );

  const active = direction === "made" ? made : received;
  const { data, isLoading, isError, error, refetch, isRefetching } = active;

  const copy = COPY[direction];
  const page = pages[direction];
  const reports = data?.reports ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;

  const counts: Record<PartnerReportDirection, number | undefined> = {
    made: made.data?.pagination.total,
    received: received.data?.pagination.total,
  };

  // Keep the whole item so the dialog still works after paging away.
  const [selected, setSelected] = useState<SelectedReport | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openReport = (report: PartnerReportHistoryItem) => {
    setSelected({ report, direction });
    setDialogOpen(true);
  };

  const changePage = (next: number) => {
    setPages((current) => ({ ...current, [direction]: next }));
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
              {copy.heading}
            </h1>
            <p className="mt-1 text-4xl font-semibold tabular-nums tracking-normal sm:text-5xl">
              {total}
            </p>
            <p className="mt-2 text-sm text-white/80">
              {total === 0
                ? copy.emptySummary
                : page === 1 && reports[0]
                  ? `Latest: ${formatLongDay(reports[0].review_date)}`
                  : `Showing page ${page} of ${pagination?.totalPages ?? 1}`}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            void made.refetch();
            void received.refetch();
          }}
          disabled={isRefetching}
          aria-label="Refresh partner reports"
          className="mb-1 flex size-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40 disabled:opacity-60"
        >
          <RefreshCw
            className={`size-4 ${isRefetching ? "animate-spin" : ""}`}
          />
        </button>
      </section>

      {/* Ledger */}
      <section aria-label="Partner reports">
        <div
          role="tablist"
          aria-label="Report type"
          className="mb-4 flex gap-6 overflow-x-auto border-b border-neutral-200"
        >
          {TABS.map((tab) => {
            const isActive = direction === tab.id;
            const count = counts[tab.id];

            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                id={`reports-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls="reports-panel"
                onClick={() => setDirection(tab.id)}
                className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors focus:outline-none focus-visible:text-blue-600 ${
                  isActive
                    ? "border-secondary-blue text-secondary-blue"
                    : "border-transparent text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {tab.label}
                {count !== undefined && (
                  <span className="ml-1.5 tabular-nums text-neutral-400">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {direction === "received" && (
          <p className="-mt-1 mb-4 flex items-start gap-1.5 text-xs text-neutral-500">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Today&apos;s report from your partner appears after you&apos;ve
            submitted yours.
          </p>
        )}

        <div
          id="reports-panel"
          role="tabpanel"
          aria-labelledby={`reports-tab-${direction}`}
        >
          {isLoading ? (
            <ul aria-busy className="space-y-3">
              {[0, 1, 2].map((n) => (
                <li key={n} className={`space-y-2.5 rounded-2xl p-5 ${GLASS}`}>
                  <div className="h-4 w-2/5 animate-pulse rounded bg-white/70" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-white/50" />
                  <div className="h-3 w-full animate-pulse rounded bg-white/50" />
                </li>
              ))}
            </ul>
          ) : isError ? (
            <div className="py-14 text-center">
              <AlertCircle className="mx-auto size-6 text-red-500" />
              <p className="mt-3 text-sm font-semibold text-neutral-900">
                We couldn&apos;t load these reports.
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
            <div className="flex flex-col items-center py-14 text-center">
              <Icon3D icon={ClipboardCheck} tone="blue" size="xl" />
              <p className="mt-5 text-sm font-semibold text-neutral-900">
                {copy.emptyTitle}
              </p>
              <p className="mt-1 max-w-xs text-sm text-neutral-600">
                {copy.emptyBody}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {reports.map((report) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  direction={direction}
                  onView={() => openReport(report)}
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
        </div>
      </section>

      <ReportDialog
        selected={selected}
        open={dialogOpen && !!selected}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Row                                                                        */
/* -------------------------------------------------------------------------- */

function ReportRow({
  report,
  direction,
  onView,
}: {
  report: PartnerReportHistoryItem;
  direction: PartnerReportDirection;
  onView: () => void;
}) {
  const copy = COPY[direction];
  const onTime = report.submitted_on_time;
  const comment = report.comment?.trim();

  return (
    <li
      className={`rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none sm:p-5 ${GLASS} ${
        onTime ? "" : "ring-1 ring-red-400/50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-snug text-neutral-900">
            {formatLongDay(report.review_date)}
          </h2>

          <p className="mt-1.5 text-sm">
            <span
              className={`inline-flex items-center gap-1.5 font-medium ${
                onTime ? "text-emerald-800" : "text-red-700"
              }`}
            >
              <span
                aria-hidden
                className={`size-2 rounded-full ${
                  onTime ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              {onTime ? copy.onTime : copy.late}
            </span>
          </p>
        </div>

        <p className="shrink-0 pt-1 text-xs tabular-nums text-neutral-500">
          {formatTime(report.reviewed_at)}
        </p>
      </div>

      <p
        className={`mt-3 line-clamp-2 whitespace-pre-line break-words text-sm leading-relaxed ${
          comment ? "text-neutral-700" : "text-neutral-500"
        }`}
      >
        {comment || copy.noComment}
      </p>

      <div className="mt-4 flex justify-end border-t border-white/60 pt-4">
        <GeneralButton onClick={onView}>View report</GeneralButton>
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog (shadcn)                                                            */
/* -------------------------------------------------------------------------- */

function ReportDialog({
  selected,
  open,
  onOpenChange,
}: {
  selected: SelectedReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!selected) return null;

  const { report, direction } = selected;
  const copy = COPY[direction];
  const onTime = report.submitted_on_time;
  const comment = report.comment?.trim();

  const reportedAt = `${formatDate(report.reviewed_at)}, ${formatTime(
    report.reviewed_at,
  )}`;

  const details: {
    label: string;
    value: string;
    icon: LucideIcon;
    tone: Tone;
  }[] = [
    {
      label: "Report date",
      value: formatLongDay(report.review_date),
      icon: CalendarDays,
      tone: "violet",
    },
    {
      label: "Verdict",
      value: onTime ? copy.onTime : copy.late,
      icon: onTime ? CheckCircle2 : Clock,
      tone: onTime ? "emerald" : "red",
    },
    {
      label: "Reported by",
      value: copy.by,
      icon: UserCheck,
      tone: "blue",
    },
    {
      label: "Reported at",
      value: reportedAt,
      icon: Clock,
      tone: "slate",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto border border-white/60 bg-white/55 p-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_24px_60px_-12px_rgba(40,50,140,0.35)] backdrop-blur-xl sm:max-w-md">
        <div className="space-y-4 p-4 sm:p-5">
          {/* Header */}
          <DialogHeader className="space-y-0 pr-8 text-left">
            <div className="flex items-start gap-3">
              <Icon3D
                icon={onTime ? CheckCircle2 : Clock}
                tone={onTime ? "emerald" : "red"}
                size="lg"
              />

              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold leading-snug tracking-tight text-secondary-blue sm:text-sm">
                  {formatLongDay(report.review_date)}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-gray-500">
                  {direction === "made"
                    ? "Your report about your partner"
                    : "Your partner's report about you"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Details */}
          <dl
            className={`divide-y divide-white/60 rounded-2xl px-4 ${GLASS_INNER}`}
          >
            {details.map((item) => (
              <div key={item.label} className="flex items-start gap-3 py-3">
                <Icon3D icon={item.icon} tone={item.tone} size="sm" />
                <div className="min-w-0 pt-0.5">
                  <dt className="text-xs text-neutral-500">{item.label}</dt>
                  <dd className="mt-0.5 text-sm leading-relaxed text-neutral-900">
                    {item.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>

          {/* Comment */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-neutral-900">
              Comment
            </h3>
            <div
              className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 ${GLASS_INNER}`}
            >
              <Icon3D icon={StickyNote} tone="slate" size="sm" />
              <p
                className={`min-w-0 whitespace-pre-line break-words pt-0.5 text-sm leading-relaxed ${
                  comment ? "text-neutral-900" : "text-neutral-500"
                }`}
              >
                {comment || copy.noComment}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2.5 border-t border-white/60 p-4 sm:flex-row sm:items-center sm:justify-end sm:space-x-0 sm:p-5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={OUTLINE_BUTTON}
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
