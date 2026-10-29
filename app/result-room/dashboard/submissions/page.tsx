"use client";

import { useState } from "react";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Info,
  RefreshCw,
} from "lucide-react";

import GeneralButton from "@/components/miscelleneous/generalButton";
import {
  useResultRoomPartnerSubmissionHistory,
  useResultRoomSubmissionHistory,
  type PartnerSubmission,
  type ResultRoomSubmissionHistoryItem,
} from "@/lib/queries/result-room";

// Adjust these paths to match your project.
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

/**
 * The "All" tab merges your submissions with your partner's, so it needs all
 * of yours at once. This is how many of yours it loads. Your history hook and
 * endpoint both cap the page size at 50, so this must not go above it. If your history
 * endpoint caps the page size lower, the note under the tabs says so.
 */
const ALL_FETCH_SIZE = 50;

type TabId = "all" | "mine" | "partner";
type Owner = "mine" | "partner";

/** Whatever formatTime accepts, so both data shapes fit one card. */
type TimeInput = Parameters<typeof formatTime>[0];

interface SubmissionsPageProps {
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* One shape for both kinds of submission                                     */
/* -------------------------------------------------------------------------- */

interface FeedItem {
  key: string;
  owner: Owner;
  id: string;
  /** YYYY-MM-DD */
  date: string;
  submittedAt: TimeInput;
  status: string;
  description: string | null;
  images: { id: string; url: string }[];
  /** What the details dialog opens. Partner items are converted to this shape. */
  source: ResultRoomSubmissionHistoryItem;
}

const fromMine = (item: ResultRoomSubmissionHistoryItem): FeedItem => ({
  key: `mine-${item.id}`,
  owner: "mine",
  id: item.id,
  date: item.submission_date,
  submittedAt: item.submitted_at,
  status: item.status,
  description: item.description,
  images: item.files.map((file) => ({
    id: file.id,
    url: file.cloudinary_url,
  })),
  source: item,
});

/**
 * The partner history comes back in a different shape (camelCase, `images`),
 * so it is converted to the shape SubmissionDetailsDialog already understands.
 * Only the fields the history endpoint actually returns are filled in.
 */
const partnerAsHistoryItem = (
  item: PartnerSubmission,
): ResultRoomSubmissionHistoryItem =>
  ({
    id: item.id,
    description: item.description,
    submission_date: item.submissionDate,
    submitted_at: item.submittedAt,
    status: item.status,
    files: item.images.map((image) => ({
      id: image.id,
      cloudinary_url: image.url,
    })),
  }) as unknown as ResultRoomSubmissionHistoryItem;

const fromPartner = (item: PartnerSubmission): FeedItem => ({
  key: `partner-${item.id}`,
  owner: "partner",
  id: item.id,
  date: item.submissionDate,
  submittedAt: item.submittedAt,
  status: item.status,
  description: item.description,
  images: item.images,
  source: partnerAsHistoryItem(item),
});

/** Newest day first; within a day, the latest submission first. */
const byNewest = (a: FeedItem, b: FeedItem) =>
  b.date.localeCompare(a.date) ||
  String(b.submittedAt ?? "").localeCompare(String(a.submittedAt ?? ""));

/** Slices an already-loaded list into pages. */
function paginate(list: FeedItem[], page: number) {
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(Math.max(page, 1), totalPages);

  return {
    items: list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    page: current,
    totalPages,
    total: list.length,
    hasMore: current < totalPages,
  };
}

/* -------------------------------------------------------------------------- */
/* Copy for the three tabs                                                    */
/* -------------------------------------------------------------------------- */

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "mine", label: "My submissions" },
  { id: "partner", label: "Partner's" },
];

const COPY: Record<
  TabId,
  {
    heading: string;
    emptySummary: string;
    emptyTitle: string;
    emptyBody: string;
    errorTitle: string;
  }
> = {
  all: {
    heading: "All submissions",
    emptySummary: "Nothing has been submitted yet.",
    emptyTitle: "No submissions yet.",
    emptyBody:
      "Once you or your partner submit evidence, it will show up here.",
    errorTitle: "We couldn't load the submissions.",
  },
  mine: {
    heading: "Your submissions",
    emptySummary: "You haven't submitted anything yet.",
    emptyTitle: "No submissions yet.",
    emptyBody:
      "Once you submit your evidence for the day, it will show up here.",
    errorTitle: "We couldn't load your submissions.",
  },
  partner: {
    heading: "Partner's submissions",
    emptySummary: "Your partner hasn't submitted anything yet.",
    emptyTitle: "Nothing from your partner yet.",
    emptyBody:
      "When your partner submits their evidence, it will show up here.",
    errorTitle: "We couldn't load your partner's submissions.",
  },
};

/**
 * Turns a raw error into something a person can read. Technical parser errors
 * (for example when the server sends back an HTML page instead of data) are
 * replaced with a plain message; clear server messages are kept.
 */
function friendlyError(error: unknown): string {
  const fallback =
    "Something went wrong on our side. Please try again in a moment.";

  if (!(error instanceof Error) || !error.message) return fallback;

  const message = error.message;

  if (/unexpected token|<!doctype|is not valid json|json/i.test(message)) {
    return fallback;
  }

  if (/failed to fetch|networkerror|network request failed/i.test(message)) {
    return "Check your connection and try again.";
  }

  return message;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function SubmissionsPage({
  className = "",
}: SubmissionsPageProps) {
  const [tab, setTab] = useState<TabId>("all");

  // Each tab remembers its own page.
  const [pages, setPages] = useState<Record<TabId, number>>({
    all: 1,
    mine: 1,
    partner: 1,
  });

  // "My submissions" pages on the server; "All" needs everything of mine.
  const mineQuery = useResultRoomSubmissionHistory(pages.mine, PAGE_SIZE);
  const mineAllQuery = useResultRoomSubmissionHistory(1, ALL_FETCH_SIZE);
  const partnerQuery = useResultRoomPartnerSubmissionHistory();
  console.log({ mineQuery, mineAllQuery, partnerQuery });

  // If the big "all of mine" request fails (for example the endpoint rejects
  // a page size of ALL_FETCH_SIZE), fall back to the first page of the normal
  // "My submissions" request so the All tab still shows yours.
  const mineAllSource =
    mineAllQuery.data?.submissions ??
    (pages.mine === 1 ? mineQuery.data?.submissions : undefined) ??
    [];

  const mineAll = mineAllSource.map(fromMine);
  const partnerAll = (partnerQuery.data?.history ?? []).map(fromPartner);

  partnerAll.sort(byNewest);

  const everything = [...mineAll, ...partnerAll].sort(byNewest);

  // One details dialog for both. Keep the whole item so it still works
  // after paging away.
  const [selected, setSelected] =
    useState<ResultRoomSubmissionHistoryItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openItem = (item: FeedItem) => {
    setSelected(item.source);
    setDialogOpen(true);
  };

  /* ---------------------------- the active tab ---------------------------- */

  let view: {
    items: FeedItem[];
    page: number;
    totalPages: number;
    total: number;
    hasMore: boolean;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    retry: () => void;
  };

  if (tab === "mine") {
    const pagination = mineQuery.data?.pagination;

    view = {
      items: (mineQuery.data?.submissions ?? []).map(fromMine),
      page: pagination?.page ?? pages.mine,
      totalPages: pagination?.totalPages ?? 1,
      total: pagination?.total ?? 0,
      hasMore: pagination?.hasMore ?? false,
      isLoading: mineQuery.isLoading,
      isError: mineQuery.isError,
      error: mineQuery.error,
      retry: () => void mineQuery.refetch(),
    };
  } else if (tab === "partner") {
    view = {
      ...paginate(partnerAll, pages.partner),
      isLoading: partnerQuery.isLoading,
      isError: partnerQuery.isError,
      error: partnerQuery.error,
      retry: () => void partnerQuery.refetch(),
    };
  } else {
    view = {
      ...paginate(everything, pages.all),
      // Show the skeleton only until something is available. As soon as either
      // side has loaded, list it; the other side joins in when it arrives (or
      // never does, if it failed). Without this, a failing request keeps
      // retrying and holds the whole tab on the skeleton.
      isLoading:
        mineAllSource.length === 0 &&
        !partnerQuery.data &&
        (mineAllQuery.isLoading ||
          mineQuery.isLoading ||
          partnerQuery.isLoading),
      // Errors never show on this tab. Whatever loaded is listed, and each
      // failure is reported only on its own tab ("My submissions" or
      // "Partner's").
      isError: false,
      error: null,
      retry: () => {
        void mineAllQuery.refetch();
        void partnerQuery.refetch();
      },
    };
  }

  const copy = COPY[tab];
  const { items, page, totalPages, total, isLoading, isError, error } = view;

  const isRefetching =
    mineQuery.isRefetching ||
    mineAllQuery.isRefetching ||
    partnerQuery.isRefetching;

  const refreshAll = () => {
    void mineQuery.refetch();
    void mineAllQuery.refetch();
    void partnerQuery.refetch();
  };

  const counts: Record<TabId, number | undefined> = {
    all:
      mineAllQuery.isLoading || mineQuery.isLoading || partnerQuery.isLoading
        ? undefined
        : everything.length,
    mine: mineQuery.data?.pagination.total,
    partner: partnerQuery.data?.history.length,
  };

  const mineCapped =
    tab === "all" && mineAllQuery.data?.pagination.hasMore
      ? mineAllQuery.data.submissions.length
      : null;

  const changePage = (next: number) => {
    setPages((current) => ({ ...current, [tab]: next }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`mx-auto w-full max-w-3xl space-y-6 ${className}`}>
      {/* Summary (slim bar) */}
      <section
        aria-label="Submission summary"
        className="flex items-center justify-between gap-4 rounded-2xl bg-secondary-blue px-4 py-3 text-white sm:px-5"
      >
        {isLoading ? (
          <div className="flex items-center gap-3">
            <div className="h-8 w-10 animate-pulse rounded bg-white/25" />
            <div className="h-4 w-36 animate-pulse rounded bg-white/25" />
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-3">
            <p className="text-3xl font-semibold leading-none tabular-nums">
              {total}
            </p>
            <div className="min-w-0">
              <h1 className="text-sm font-medium">{copy.heading}</h1>
              <p className="truncate text-xs text-white/75">
                {total === 0
                  ? copy.emptySummary
                  : page === 1 && items[0]
                    ? `Latest: ${formatLongDay(items[0].date)}`
                    : `Page ${page} of ${totalPages}`}
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={refreshAll}
          disabled={isRefetching}
          aria-label="Refresh submissions"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40 disabled:opacity-60"
        >
          <RefreshCw
            className={`size-4 ${isRefetching ? "animate-spin" : ""}`}
          />
        </button>
      </section>

      {/* History */}
      <section aria-label="Submission history">
        <div
          role="tablist"
          aria-label="Submission source"
          className="mb-3 flex gap-6 overflow-x-auto border-b border-neutral-200"
        >
          {TABS.map((item) => {
            const isActive = tab === item.id;
            const count = counts[item.id];

            return (
              <button
                key={item.id}
                role="tab"
                type="button"
                id={`submissions-tab-${item.id}`}
                aria-selected={isActive}
                aria-controls="submissions-panel"
                onClick={() => setTab(item.id)}
                className={`-mb-px whitespace-nowrap border-b-2 pb-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:text-blue-600 ${
                  isActive
                    ? "border-secondary-blue text-secondary-blue"
                    : "border-transparent text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {item.label}
                {count !== undefined && (
                  <span className="ml-1.5 tabular-nums text-neutral-400">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {mineCapped !== null && (
          <p className="-mt-1 mb-4 flex items-start gap-1.5 text-xs text-neutral-500">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Showing your latest {mineCapped} submissions alongside your
            partner&apos;s. See &ldquo;My submissions&rdquo; for the rest.
          </p>
        )}

        <div
          id="submissions-panel"
          role="tabpanel"
          aria-labelledby={`submissions-tab-${tab}`}
        >
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
                {copy.errorTitle}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                {friendlyError(error)}
              </p>
              <div className="mt-5 flex justify-center">
                <GeneralButton
                  text="Try again"
                  variant="active"
                  buttonFunction={view.retry}
                />
              </div>
            </div>
          ) : items.length === 0 ? (
            <div
              className={`flex flex-col items-center rounded-2xl px-6 py-14 text-center ${GLASS}`}
            >
              <Icon3D icon={ImagePlus} tone="blue" size="xl" />
              <p className="mt-5 text-sm font-semibold text-neutral-900">
                {copy.emptyTitle}
              </p>
              <p className="mt-1 max-w-xs text-sm text-neutral-600">
                {copy.emptyBody}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <SubmissionCard
                  key={item.key}
                  item={item}
                  showOwner={tab === "all"}
                  onOpen={() => openItem(item)}
                />
              ))}
            </ul>
          )}

          {/* Pagination */}
          {!isLoading && !isError && totalPages > 1 && (
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
                Page {page} of {totalPages}
              </p>

              <button
                type="button"
                onClick={() => changePage(page + 1)}
                disabled={!view.hasMore}
                className={OUTLINE_BUTTON}
              >
                Next
                <ChevronRight className="size-4" />
              </button>
            </nav>
          )}
        </div>
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

const OWNER_BADGE: Record<Owner, { label: string; className: string }> = {
  mine: {
    label: "You",
    className:
      "border-blue-400/80 bg-gradient-to-b from-blue-400 to-blue-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_6px_-1px_rgba(59,130,246,0.5)]",
  },
  partner: {
    label: "Partner",
    className:
      "border-violet-400/80 bg-gradient-to-b from-violet-400 to-violet-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_6px_-1px_rgba(139,92,246,0.5)]",
  },
};

function SubmissionCard({
  item,
  showOwner,
  onOpen,
}: {
  item: FeedItem;
  /** Label whose submission it is (only needed on the "All" tab). */
  showOwner: boolean;
  onOpen: () => void;
}) {
  const status = statusVisual(item.status);
  const description = item.description?.trim();
  const images = item.images;
  const extra = images.length - MAX_THUMBS;
  const badge = OWNER_BADGE[item.owner];

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View ${
          item.owner === "partner" ? "your partner's " : ""
        }submission for ${formatLongDay(item.date)}`}
        className={`group block w-full rounded-2xl p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 motion-reduce:transition-none sm:p-5 ${GLASS}`}
      >
        <div className="flex items-start gap-3">
          <Icon3D icon={status.icon} tone={status.tone} size="md" />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="text-base font-semibold leading-snug text-neutral-900">
                  {formatLongDay(item.date)}
                </h2>

                {showOwner && (
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                )}
              </div>

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
                Submitted at {formatTime(item.submittedAt)}
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

        {images.length > 0 && (
          <div className="mt-4 flex items-center gap-3 border-t border-white/60 pt-4">
            <div className="flex items-center gap-2">
              {images.slice(0, MAX_THUMBS).map((image, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={image.id}
                  src={cloudinaryImage(
                    image.url,
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
              {plural(images.length, "image")}
            </span>
          </div>
        )}
      </button>
    </li>
  );
}
