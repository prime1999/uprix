"use client";

import { useState } from "react";

import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  FileX,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  StickyNote,
  UserX,
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
  useResultRoomViolations,
  type ResultRoomViolation,
} from "@/lib/queries/result-room";

// Adjust this path to wherever you keep icon-3d.tsx.
import {
  Icon3D,
  type Tone,
} from "@/components/result-room/dashboard/fines/icon-3d";

const PAGE_SIZE = 10;

interface ViolationsPageProps {
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const GLASS =
  "border border-white/60 bg-white/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_-8px_rgba(60,70,160,0.25)]";

const GLASS_INNER = "border border-white/70 bg-white/30 backdrop-blur-md";

const OUTLINE_BUTTON =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-neutral-300 bg-white/70 px-5 py-2.5 text-xs font-bold text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const humanize = (value: string | null | undefined) => {
  if (!value) return "";
  const text = value.replace(/[_-]+/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** occurred_on is a plain date, so parse it as a local day (no timezone shift). */
const parseDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

const formatDay = (value: string | null | undefined) => {
  if (!value) return null;

  const date = parseDate(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const isResolved = (violation: ResultRoomViolation) => !!violation.resolved_at;

/** Pick an icon from the violation's type. Add cases to match your own types. */
function typeIcon(type: string): LucideIcon {
  const value = type.toLowerCase();

  if (/report|review|partner/.test(value)) return UserX;
  if (/late|deadline|time/.test(value)) return Clock;
  if (/submission|task|miss/.test(value)) return FileX;

  return ShieldAlert;
}

const STATUS = {
  open: { label: "Open", dot: "bg-red-500", text: "text-red-700" },
  resolved: {
    label: "Resolved",
    dot: "bg-emerald-500",
    text: "text-emerald-800",
  },
} as const;

const statusOf = (violation: ResultRoomViolation) =>
  isResolved(violation) ? STATUS.resolved : STATUS.open;

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ViolationsPage({
  className = "",
}: ViolationsPageProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useResultRoomViolations(page, PAGE_SIZE);

  // Keep the whole item so the dialog still works after paging away.
  const [selected, setSelected] = useState<ResultRoomViolation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const violations = data?.violations ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;

  const openOnPage = violations.filter((item) => !isResolved(item)).length;

  const openViolation = (violation: ResultRoomViolation) => {
    setSelected(violation);
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
        aria-label="Violations summary"
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
              {total === 0 ? "Violations" : "Violations on your record"}
            </h1>
            <p className="mt-1 text-4xl font-semibold tabular-nums tracking-normal sm:text-5xl">
              {total}
            </p>
            <p className="mt-2 text-sm text-white/80">
              {total === 0
                ? "Clean record. Keep it up."
                : openOnPage > 0
                  ? `${plural(openOnPage, "violation")} still open on this page.`
                  : "Everything on this page is resolved."}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          aria-label="Refresh violations"
          className="mb-1 flex size-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40 disabled:opacity-60"
        >
          <RefreshCw
            className={`size-4 ${isRefetching ? "animate-spin" : ""}`}
          />
        </button>
      </section>

      {/* List */}
      <section aria-label="Violation history">
        {isLoading ? (
          <ul aria-busy className="space-y-3">
            {[0, 1, 2].map((n) => (
              <li key={n} className={`rounded-2xl p-3 sm:p-4 ${GLASS}`}>
                <div className="flex items-center gap-3">
                  <div className="size-11 shrink-0 animate-pulse rounded-xl bg-white/70" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/5 animate-pulse rounded bg-white/70" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-white/50" />
                  </div>
                  <div className="h-9 w-16 shrink-0 animate-pulse rounded-full bg-white/60" />
                </div>
              </li>
            ))}
          </ul>
        ) : isError ? (
          <div className="py-14 text-center">
            <AlertCircle className="mx-auto size-6 text-red-500" />
            <p className="mt-3 text-sm font-semibold text-neutral-900">
              We couldn&apos;t load your violations.
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
        ) : violations.length === 0 ? (
          <div
            className={`flex flex-col items-center rounded-2xl px-6 py-14 text-center ${GLASS}`}
          >
            <Icon3D icon={ShieldCheck} tone="emerald" size="xl" />
            <p className="mt-5 text-sm font-semibold text-neutral-900">
              You have no violations.
            </p>
            <p className="mt-1 max-w-xs text-sm text-neutral-600">
              Missing a deadline or a rule will show up here. Keep your record
              clean.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {violations.map((violation) => (
              <ViolationRow
                key={violation.id}
                violation={violation}
                onView={() => openViolation(violation)}
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
              disabled={!pagination.hasPreviousPage}
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
              disabled={!pagination.hasNextPage}
              className={OUTLINE_BUTTON}
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </nav>
        )}
      </section>

      <ViolationDialog
        violation={selected}
        open={dialogOpen && !!selected}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Row                                                                        */
/* -------------------------------------------------------------------------- */

function ViolationRow({
  violation,
  onView,
}: {
  violation: ResultRoomViolation;
  onView: () => void;
}) {
  const status = statusOf(violation);
  const resolved = isResolved(violation);
  const title = humanize(violation.type) || "Violation";

  // One line of context: the notes, else the consequence, else a note.
  const summary =
    violation.notes?.trim() ||
    violation.consequence?.trim() ||
    "No notes were added.";

  return (
    <li
      className={`rounded-2xl p-3 transition-transform duration-200 hover:-translate-y-0.5 sm:p-4 ${GLASS} ${
        resolved ? "" : "ring-1 ring-red-400/40"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon3D
          icon={resolved ? BadgeCheck : typeIcon(violation.type)}
          tone={resolved ? "emerald" : "red"}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold leading-snug text-neutral-900 sm:text-base">
            {title}
          </h2>

          <p className="flex items-center gap-x-3 truncate text-xs sm:text-sm">
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 font-medium ${status.text}`}
            >
              <span
                aria-hidden
                className={`size-2 rounded-full ${status.dot}`}
              />
              {status.label}
            </span>

            <span className="truncate text-neutral-600">
              {formatDay(violation.occurred_on)}
            </span>
          </p>

          <p className="mt-0.5 truncate text-xs text-neutral-500">{summary}</p>
        </div>

        {/* A short button on the same row, so the card stays one block tall */}
        <GeneralButton
          onClick={onView}
          className="shrink-0 !px-4 !py-2"
          aria-label={`View details: ${title}`}
        >
          View
        </GeneralButton>
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog (shadcn)                                                            */
/* -------------------------------------------------------------------------- */

function ViolationDialog({
  violation,
  open,
  onOpenChange,
}: {
  violation: ResultRoomViolation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!violation) return null;

  const status = statusOf(violation);
  const resolved = isResolved(violation);

  const details = (
    [
      {
        label: "What happened",
        value: humanize(violation.type) || null,
        icon: typeIcon(violation.type),
        tone: "red",
      },
      {
        label: "Date it happened",
        value: formatDay(violation.occurred_on),
        icon: CalendarDays,
        tone: "violet",
      },
      {
        label: "Notes",
        value: violation.notes?.trim() || null,
        icon: StickyNote,
        tone: "slate",
      },
      {
        label: "Consequence",
        value: violation.consequence?.trim() || null,
        icon: Scale,
        tone: "amber",
      },
      {
        label: "Recorded on",
        value: formatDay(violation.created_at),
        icon: FileText,
        tone: "blue",
      },
    ] satisfies {
      label: string;
      value: string | null;
      icon: LucideIcon;
      tone: Tone;
    }[]
  ).filter((item) => item.value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto border border-white/60 bg-white/55 p-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_24px_60px_-12px_rgba(40,50,140,0.35)] backdrop-blur-2xl sm:max-w-md">
        <div className="space-y-4 p-4 sm:p-5">
          {/* Header */}
          <DialogHeader className="space-y-0 pr-8 text-left">
            <div className="flex items-start gap-3">
              <Icon3D
                icon={resolved ? BadgeCheck : typeIcon(violation.type)}
                tone={resolved ? "emerald" : "red"}
                size="lg"
              />

              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold leading-snug tracking-tight text-secondary-blue sm:text-sm">
                  {humanize(violation.type) || "Violation"}
                </DialogTitle>
                <DialogDescription className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                  <span
                    className={`inline-flex items-center gap-1.5 font-medium ${status.text}`}
                  >
                    <span
                      aria-hidden
                      className={`size-2 rounded-full ${status.dot}`}
                    />
                    {status.label}
                  </span>
                  <span>{formatDay(violation.occurred_on)}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Details */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-neutral-900">
              What was recorded
            </h3>

            <dl
              className={`divide-y divide-white/60 rounded-2xl px-4 ${GLASS_INNER}`}
            >
              {details.map((item) => (
                <div key={item.label} className="flex items-start gap-3 py-3">
                  <Icon3D icon={item.icon} tone={item.tone} size="sm" />
                  <div className="min-w-0 pt-0.5">
                    <dt className="text-xs text-neutral-500">{item.label}</dt>
                    <dd className="mt-0.5 whitespace-pre-line break-words text-sm leading-relaxed text-neutral-900">
                      {item.value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {/* Resolution */}
          {resolved ? (
            <div
              className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 ${GLASS_INNER}`}
            >
              <Icon3D icon={BadgeCheck} tone="emerald" size="sm" />
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-medium text-neutral-900">
                  Resolved on {formatDay(violation.resolved_at)}
                </p>
                {violation.resolution_note?.trim() && (
                  <p className="mt-0.5 whitespace-pre-line break-words text-sm leading-relaxed text-neutral-600">
                    {violation.resolution_note}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div
              className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 ${GLASS_INNER}`}
            >
              <Icon3D icon={Clock} tone="amber" size="sm" />
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-medium text-neutral-900">
                  Not resolved yet
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">
                  Settle any fine linked to this violation and it will be marked
                  resolved. If you think it was recorded by mistake, send a
                  complaint from the Help Center.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-white/60 p-4 sm:p-5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={`${OUTLINE_BUTTON} w-full sm:w-auto`}
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
