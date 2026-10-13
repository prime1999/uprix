"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  ImageIcon,
  LoaderCircle,
  Maximize2,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import GeneralButton from "@/components/miscelleneous/generalButton";
import { useResultRoomPartnerSubmission } from "@/lib/queries/result-room";
// Adjust this import to the actual file containing your React Query hook.

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface SubmissionImage {
  id: string;
  url: string;
}

export interface Submission {
  id: string;
  description: string | null;
  submissionDate: string;
  submittedAt: string | null;
  status: string;
  images: SubmissionImage[];
}

interface SubmissionResponse {
  success: boolean;
  submission: Submission | null;
  error?: string;
  message?: string;
}

interface SubmissionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  endpoint?: string;
  title?: string;
  description?: string;
  mode?: "partner" | "own";
}

/* -------------------------------------------------------------------------- */
/* Data + formatting helpers                                                  */
/* -------------------------------------------------------------------------- */

async function fetchSubmission(
  endpoint: string,
  date: string,
): Promise<Submission | null> {
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${endpoint}${separator}date=${encodeURIComponent(date)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const errorData = data as {
      error?: string;
      message?: string;
    };

    throw new Error(
      errorData.message ||
        errorData.error ||
        `Failed to load submission (${response.status}).`,
    );
  }

  const result = data as SubmissionResponse;

  if (!result.success) {
    throw new Error(
      result.error || result.message || "Failed to load submission.",
    );
  }

  return result.submission;
}

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

function formatStatus(status: string): string {
  return status
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/** Small 3D status pills: gradient, top highlight line, soft glow. */
function getStatusStyles(status: string): string {
  switch (status.toLowerCase()) {
    case "approved":
    case "completed":
    case "accepted":
      return "border-emerald-400/80 bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_6px_-1px_rgba(16,185,129,0.5)]";

    case "pending":
    case "submitted":
    case "under_review":
    case "under review":
      return "border-amber-300/80 bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_2px_6px_-1px_rgba(245,158,11,0.5)]";

    case "rejected":
    case "failed":
      return "border-red-400/80 bg-gradient-to-b from-red-400 to-red-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_6px_-1px_rgba(239,68,68,0.5)]";

    default:
      return "border-white/70 bg-white/50 text-neutral-700 backdrop-blur-md";
  }
}

/* -------------------------------------------------------------------------- */
/* Design tokens (same glass + 3D language as the submission form)            */
/* -------------------------------------------------------------------------- */

const GLASS =
  "border border-white/60 bg-white/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_-8px_rgba(60,70,160,0.25)]";

const GLASS_INNER = "border border-white/70 bg-white/40 backdrop-blur-md";

const CSS = `
@keyframes sv-drift {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50%      { transform: translate3d(30px, 20px, 0) scale(1.15); }
}
@keyframes sv-in {
  from { opacity: 0; transform: translateY(12px) scale(.98); }
  to   { opacity: 1; transform: none; }
}
.sv-drift { animation: sv-drift 14s ease-in-out infinite; }
.sv-in    { animation: sv-in .35s cubic-bezier(.2,.8,.2,1) both; }
@media (prefers-reduced-motion: reduce) {
  .sv-drift, .sv-in { animation: none !important; }
}
`;

/** 3D tile used for state icons (blue by default, red for errors). */
function Tile3D({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "red";
}) {
  const palette =
    tone === "red"
      ? "border-red-400/80 from-red-400 via-red-500 to-red-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(239,68,68,0.6)]"
      : "border-blue-400/80 from-blue-400 via-blue-500 to-blue-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(59,130,246,0.6)]";

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
/* Evidence stack slider                                                      */
/*                                                                            */
/* Cards are stacked with the next two peeking out behind the front one, with */
/* a round handle on the edge and a back button below. Every card is sized to */
/* its own image, so images of different shapes are never cropped awkwardly.  */
/* -------------------------------------------------------------------------- */

function EvidenceStack({
  images,
  index,
  onChange,
  dateLabel,
  onExpand,
}: {
  images: SubmissionImage[];
  index: number;
  onChange: (index: number) => void;
  dateLabel: string;
  onExpand: () => void;
}) {
  const count = images.length;

  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
  const [stage, setStage] = useState({ w: 640, h: 360 });
  const [ratios, setRatios] = useState<Record<string, number>>({});

  const startX = useRef<number | null>(null);
  const swiped = useRef(false);

  useEffect(() => {
    if (!stageEl) return;
    const update = () =>
      setStage({ w: stageEl.clientWidth, h: stageEl.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stageEl);
    return () => observer.disconnect();
  }, [stageEl]);

  const go = (i: number) => onChange(((i % count) + count) % count);
  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  const multiple = count > 1;
  const step = Math.max(16, Math.min(26, stage.w * 0.04));

  // Fit each image inside the stage while keeping its own shape.
  const maxW = stage.w - step * 2 - 24;
  const maxH = stage.h - 40;

  const sizeOf = (id: string) => {
    const ratio = ratios[id] ?? 4 / 3;
    const w = Math.min(maxW, maxH * ratio);
    return { w, h: w / ratio };
  };

  const front = sizeOf(images[index]?.id ?? "");
  // the handle straddles the right edge of the front card
  const handleLeft = front.w / 2 - step - 22;

  return (
    <div className="space-y-4">
      <div
        ref={setStageEl}
        role="group"
        aria-roledescription="carousel"
        aria-label="Evidence images"
        onPointerDown={(e) => {
          startX.current = e.clientX;
          swiped.current = false;
        }}
        onPointerUp={(e) => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > 50 && multiple) {
            swiped.current = true;
            if (dx < 0) {
              next();
            } else {
              prev();
            }
          }
        }}
        onPointerCancel={() => (startX.current = null)}
        className="relative h-[320px] touch-pan-y select-none overflow-hidden"
      >
        {images.map((image, i) => {
          const d = (((i - index) % count) + count) % count;
          const { w, h } = sizeOf(image.id);

          // front / peeking behind / leaving to the left / parked out of sight
          let x = 0;
          let scale = 1;
          let opacity = 1;
          let z = 0;

          if (d === 0) {
            x = -step;
            z = 30;
          } else if (d <= 2) {
            x = -step + d * step;
            scale = 1 - d * 0.05;
            z = 30 - d * 10;
          } else if (d === count - 1) {
            x = -step - w * 1.05;
            opacity = 0;
            z = 25;
          } else {
            x = step * 2;
            scale = 0.8;
            opacity = 0;
          }

          const isFront = d === 0;
          const isPeek = d > 0 && d <= 2;

          return (
            <div
              key={image.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!isFront}
              onClick={() => {
                if (swiped.current) {
                  swiped.current = false;
                  return;
                }
                if (isPeek) go(i);
              }}
              className={`absolute left-1/2 top-1/2 overflow-hidden rounded-3xl bg-white shadow-[0_18px_40px_-18px_rgba(30,40,120,0.55)] ring-1 ring-black/5 transition-[transform,opacity] duration-700 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${
                isPeek ? "cursor-pointer" : ""
              }`}
              style={{
                width: w,
                height: h,
                zIndex: z,
                opacity,
                pointerEvents: opacity === 0 ? "none" : "auto",
                transform: `translate(-50%, -50%) translateX(${x}px) scale(${scale})`,
              }}
            >
              <Image
                src={image.url}
                alt={`Submission evidence ${i + 1}`}
                fill
                unoptimized
                priority={d <= 2}
                sizes="(max-width: 448px) 90vw, 400px"
                draggable={false}
                onLoad={(event) => {
                  const { naturalWidth, naturalHeight } = event.currentTarget;
                  if (!naturalWidth || !naturalHeight) return;
                  const ratio = naturalWidth / naturalHeight;
                  setRatios((current) =>
                    current[image.id] === ratio
                      ? current
                      : { ...current, [image.id]: ratio },
                  );
                }}
                className="object-cover"
              />

              {/* coloured layers on the cards behind, like the stacked cards */}
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-0 bg-violet-600/60 transition-opacity duration-700 motion-reduce:transition-none ${
                  d === 1 ? "opacity-100" : "opacity-0"
                }`}
              />
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-0 bg-emerald-500/60 transition-opacity duration-700 motion-reduce:transition-none ${
                  d === 2 ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* details on the front card only */}
              <div
                className={`transition-opacity duration-500 motion-reduce:transition-none ${
                  isFront ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent"
                />

                <span className="absolute left-4 top-4 text-[11px] font-medium tracking-wide text-white/85">
                  {dateLabel}
                </span>

                <button
                  type="button"
                  aria-label="Expand image"
                  tabIndex={isFront ? 0 : -1}
                  onClick={onExpand}
                  className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border border-white/60 bg-white/25 text-white backdrop-blur-md transition hover:bg-white/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40"
                >
                  <Maximize2 className="size-4" />
                </button>

                <span className="absolute bottom-4 left-4 text-sm font-semibold tabular-nums text-white">
                  {i + 1}/{count}
                </span>

                <a
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={isFront ? 0 : -1}
                  className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 text-sm font-medium text-white transition hover:text-white/80"
                >
                  Open image
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>
          );
        })}

        {/* round handle on the front card's edge */}
        {multiple && (
          <button
            type="button"
            aria-label="Next image"
            onClick={next}
            className="absolute top-1/2 z-40 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/35 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_20px_-6px_rgba(30,40,120,0.5)] backdrop-blur-md transition-transform duration-200 hover:scale-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 active:scale-95"
            style={{ left: `calc(50% + ${handleLeft}px)` }}
          >
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>

      {/* back button + dots */}
      {multiple && (
        <div className="flex items-center justify-center gap-5">
          {/* 3D blue back button */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous image"
            className="group relative flex size-11 items-center justify-center overflow-hidden rounded-full border border-blue-400/80 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(59,130,246,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_12px_22px_-6px_rgba(59,130,246,0.7)] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 active:translate-y-0.5 active:shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_3px_8px_-3px_rgba(59,130,246,0.5)]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-1.5 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/50 to-transparent"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-white/30 transition-transform duration-700 group-hover:translate-x-[400%]"
            />
            <ArrowLeft className="relative size-5" />
          </button>

          <div className="flex items-center gap-1.5">
            {images.map((image, i) => (
              <button
                key={image.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`View evidence image ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all duration-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 motion-reduce:transition-none ${
                  i === index
                    ? "w-6 bg-blue-500"
                    : "w-2 bg-neutral-300 hover:bg-neutral-400"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function SubmissionViewModal({
  isOpen,
  onClose,
  date,
  endpoint,
  title,
  description,
  mode = "partner",
}: SubmissionViewModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);

  /*
   * Partner mode:
   * Reuse the existing project-level React Query hook and its cache key.
   *
   * Own mode:
   * Use the supplied endpoint with a separate query key.
   */
  const partnerQuery = useResultRoomPartnerSubmission(
    date,
    isOpen && mode === "partner",
  );

  const ownQuery = useQuery({
    queryKey: ["result-room", "own-submission-view", endpoint, date],
    queryFn: () => {
      if (!endpoint) {
        throw new Error("An endpoint is required to view your own submission.");
      }

      return fetchSubmission(endpoint, date);
    },
    enabled:
      isOpen &&
      mode === "own" &&
      Boolean(endpoint) &&
      /^\d{4}-\d{2}-\d{2}$/.test(date),
    staleTime: 0,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const activeQuery = mode === "partner" ? partnerQuery : ownQuery;

  const submission =
    mode === "partner"
      ? (partnerQuery.data?.submission ?? null)
      : (ownQuery.data ?? null);

  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;
  const error = activeQuery.error;
  const refetch = activeQuery.refetch;

  const images = submission?.images ?? [];
  const activeImage = images[activeImageIndex];

  useEffect(() => {
    if (!isOpen) {
      setActiveImageIndex(0);
      setIsImageExpanded(false);
    }
  }, [isOpen]);

  // move focus into the dialog when it opens
  useEffect(() => {
    if (isOpen) dialogRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isImageExpanded) {
          setIsImageExpanded(false);
        } else {
          onClose();
        }
      }

      if (event.key === "ArrowLeft" && !isImageExpanded) {
        setActiveImageIndex((current) =>
          current > 0 ? current - 1 : Math.max(images.length - 1, 0),
        );
      }

      if (event.key === "ArrowRight" && !isImageExpanded) {
        setActiveImageIndex((current) =>
          current < images.length - 1 ? current + 1 : 0,
        );
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isImageExpanded, images.length, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [date, submission?.id]);

  if (!isOpen) {
    return null;
  }

  const modalTitle =
    title || (mode === "partner" ? "Partner's submission" : "Your submission");

  const modalDescription =
    description ||
    (mode === "partner"
      ? "Review your partner's task and supporting evidence."
      : "View your submitted task and supporting evidence.");

  return (
    <>
      <style>{CSS}</style>

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
          aria-labelledby="submission-modal-title"
          className="sv-in relative isolate flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 shadow-2xl outline-none sm:rounded-3xl"
        >
          {/* soft colour blobs the glass can frost */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="sv-drift absolute -left-10 -top-10 size-56 rounded-full bg-blue-300/60 blur-3xl" />
            <div className="absolute -bottom-12 -right-10 size-64 rounded-full bg-violet-300/60 blur-3xl" />
            <div className="absolute left-1/2 top-1/3 size-40 -translate-x-1/2 rounded-full bg-cyan-200/50 blur-3xl" />
          </div>

          {/* Header */}
          <header className="flex items-start justify-between gap-4 border-b border-white/60 bg-white/30 px-5 py-4 backdrop-blur-xl">
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold tracking-wide text-neutral-600">
                <FileText className="size-4 text-blue-500" />
                <span>RESULT ROOM</span>
              </div>

              <h2
                id="submission-modal-title"
                className="text-lg font-semibold tracking-tight text-secondary-blue"
              >
                {modalTitle}
              </h2>

              <p className="mt-1 text-sm text-neutral-600">
                {modalDescription}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close submission modal"
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
                  Loading submission...
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
                  Could not load submission
                </h3>

                <p className="mt-2 max-w-md text-sm text-neutral-600">
                  {error instanceof Error
                    ? error.message
                    : "Something went wrong while loading this submission."}
                </p>

                <div className="mt-5">
                  <GeneralButton
                    text="Try again"
                    variant="active"
                    buttonFunction={() => void refetch()}
                  />
                </div>
              </div>
            ) : !submission ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                <span
                  className={`mb-4 flex size-14 items-center justify-center rounded-2xl ${GLASS_INNER} shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]`}
                >
                  <ImageIcon className="size-6 text-neutral-500" />
                </span>

                <h3 className="font-semibold text-neutral-950">
                  No submission found
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-600">
                  {mode === "partner"
                    ? "Your partner has not submitted evidence for this date, or no submission is available."
                    : "You have no submission available for this date."}
                </p>

                <p className="mt-3 text-xs text-neutral-500">
                  {formatDate(date)}
                </p>
              </div>
            ) : (
              <div className="space-y-6 p-5">
                {/* Submission metadata */}
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyles(
                      submission.status,
                    )}`}
                  >
                    {formatStatus(submission.status)}
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-sm text-neutral-600">
                    <CalendarDays className="size-4" />
                    {formatDate(submission.submissionDate)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-xl p-4 ${GLASS_INNER}`}>
                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
                      <CalendarDays className="size-4 text-blue-500" />
                      Submission date
                    </div>

                    <p className="mt-2 text-sm font-semibold text-neutral-900">
                      {formatDate(submission.submissionDate)}
                    </p>
                  </div>

                  <div className={`rounded-xl p-4 ${GLASS_INNER}`}>
                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
                      <Clock3 className="size-4 text-blue-500" />
                      Submitted at
                    </div>

                    <p className="mt-2 text-sm font-semibold text-neutral-900">
                      {formatDateTime(submission.submittedAt)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-neutral-900">
                    Submission description
                  </h3>

                  {submission.description?.trim() ? (
                    <div
                      className={`whitespace-pre-wrap break-words rounded-xl p-4 text-sm leading-7 text-neutral-800 ${GLASS_INNER}`}
                    >
                      {submission.description}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-blue-300/80 bg-white/30 p-4 text-sm text-neutral-600 backdrop-blur-md">
                      No description was provided.
                    </p>
                  )}
                </section>

                {/* Evidence gallery */}
                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900">
                        Supporting evidence
                      </h3>

                      <p className="mt-1 text-xs text-neutral-600">
                        {images.length === 0
                          ? "No images attached"
                          : `${images.length} ${
                              images.length === 1 ? "image" : "images"
                            } attached`}
                      </p>
                    </div>
                  </div>

                  {images.length === 0 ? (
                    <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-blue-300/80 bg-white/30 text-center backdrop-blur-md">
                      <ImageIcon className="mb-2 size-6 text-neutral-500" />
                      <p className="text-sm text-neutral-600">
                        No evidence images are available.
                      </p>
                    </div>
                  ) : (
                    <EvidenceStack
                      images={images}
                      index={activeImageIndex}
                      onChange={setActiveImageIndex}
                      dateLabel={formatDate(submission.submissionDate)}
                      onExpand={() => setIsImageExpanded(true)}
                    />
                  )}
                </section>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="flex items-center justify-between gap-3 border-t border-white/60 bg-white/30 px-5 py-4 backdrop-blur-xl">
            <p className="text-xs text-neutral-600">{formatDate(date)}</p>

            <GeneralButton
              text="Close"
              variant="active"
              buttonFunction={onClose}
            />
          </footer>
        </section>
      </div>

      {/* Expanded image viewer */}
      {isImageExpanded && activeImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/90 p-4 backdrop-blur-xl"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsImageExpanded(false);
            }
          }}
        >
          <button
            type="button"
            onClick={() => setIsImageExpanded(false)}
            aria-label="Close expanded image"
            className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-md transition hover:bg-white/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50"
          >
            <X className="size-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={() =>
                  setActiveImageIndex((current) =>
                    current === 0 ? images.length - 1 : current - 1,
                  )
                }
                className="absolute left-3 z-10 flex size-11 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-md transition hover:bg-white/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50 sm:left-6"
              >
                <ChevronLeft className="size-6" />
              </button>

              <button
                type="button"
                aria-label="Next image"
                onClick={() =>
                  setActiveImageIndex((current) =>
                    current === images.length - 1 ? 0 : current + 1,
                  )
                }
                className="absolute right-3 z-10 flex size-11 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-md transition hover:bg-white/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50 sm:right-6"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}

          <div className="relative h-full max-h-[90vh] w-full max-w-6xl">
            <Image
              key={activeImage.id}
              src={activeImage.url}
              alt={`Expanded submission evidence ${activeImageIndex + 1}`}
              fill
              unoptimized
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-5 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm text-white backdrop-blur-md">
              {activeImageIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
