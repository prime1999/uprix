"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ImageOff,
  Maximize2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ResultRoomSubmissionHistoryFile } from "@/lib/queries/result-room";

import { cloudinaryImage, driveVisual } from "./submission-utils";

type SubmissionFile = ResultRoomSubmissionHistoryFile;

/** Tiny, blurred-out version used for the glow and card backgrounds. */
const ambientSrc = (file: SubmissionFile) =>
  cloudinaryImage(file.cloudinary_url, "f_auto,q_auto,w_300");

/* -------------------------------------------------------------------------- */
/* The picture inside a card (memoised so dragging stays smooth)              */
/* -------------------------------------------------------------------------- */

const CardFace = memo(function CardFace({
  file,
  index,
  total,
  eager,
}: {
  file: SubmissionFile;
  index: number;
  total: number;
  eager: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-200/60 px-4 text-center text-neutral-500">
        <ImageOff className="size-7" />
        <span className="text-xs">This image couldn&apos;t be loaded.</span>
      </span>
    );
  }

  return (
    <>
      {/* Blurred copy fills the frame so nothing has to be cropped */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ambientSrc(file)}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 size-full scale-125 object-cover blur-xl saturate-150"
      />

      {!loaded && (
        <span
          aria-hidden
          className="absolute inset-0 animate-pulse bg-white/40"
        />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cloudinaryImage(file.cloudinary_url, "f_auto,q_auto,w_1000")}
        alt={`Evidence image ${index + 1} of ${total}`}
        loading={eager ? "eager" : "lazy"}
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`relative size-full select-none object-contain transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
});

/* -------------------------------------------------------------------------- */
/* Full-screen viewer (nested shadcn dialog)                                  */
/* -------------------------------------------------------------------------- */

function Lightbox({
  files,
  index,
  open,
  onOpenChange,
  onChange,
}: {
  files: SubmissionFile[];
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (index: number) => void;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [zoomed, setZoomed] = useState(false);

  const count = files.length;
  const file = files[index];

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= count) return;
      onChange(next);
    },
    [count, onChange],
  );

  // New image, or viewer reopened: start un-zoomed.
  useEffect(() => {
    setZoomed(false);
  }, [index, open]);

  // Centre the picture when zooming in.
  useEffect(() => {
    const element = stage.current;
    if (!zoomed || !element) return;

    element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
    element.scrollTop = (element.scrollHeight - element.clientHeight) / 2;
  }, [zoomed]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    }
  };

  if (!file) return null;

  const navButton =
    "absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-white/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onKeyDown={onKeyDown}
        className="left-0 top-0 h-[100dvh] max-h-none w-screen max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-0 bg-neutral-950/95 p-0 text-white backdrop-blur-2xl data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0 data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 sm:rounded-none [&>button]:right-3 [&>button]:top-3 [&>button]:z-20 [&>button]:rounded-full [&>button]:bg-white/15 [&>button]:p-2.5 [&>button]:text-white [&>button]:opacity-100 [&>button]:backdrop-blur-md [&>button]:hover:bg-white/25"
      >
        <DialogTitle className="sr-only">Evidence image viewer</DialogTitle>
        <DialogDescription className="sr-only">
          Image {index + 1} of {count}. Use the arrow keys to move between
          images and tap the image to zoom.
        </DialogDescription>

        <div className="flex h-full min-h-0 flex-col">
          {/* Top bar */}
          <div className="flex items-center gap-3 px-4 pb-2 pr-16 pt-4">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium tabular-nums backdrop-blur-md">
              {index + 1} / {count}
            </span>

            <a
              href={file.cloudinary_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-md transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              <ExternalLink className="size-3.5" />
              Original
            </a>
          </div>

          {/* Stage */}
          <div
            ref={stage}
            onTouchStart={(event) => {
              touchStartX.current = zoomed ? null : event.touches[0].clientX;
            }}
            onTouchEnd={(event) => {
              if (touchStartX.current === null) return;

              const distance =
                event.changedTouches[0].clientX - touchStartX.current;
              touchStartX.current = null;

              if (Math.abs(distance) > 50) {
                go(distance < 0 ? index + 1 : index - 1);
              }
            }}
            className="relative flex min-h-0 flex-1 overflow-auto"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={file.id}
              src={cloudinaryImage(file.cloudinary_url, "f_auto,q_auto,w_2000")}
              alt={`Evidence image ${index + 1} of ${count}`}
              draggable={false}
              onClick={() => setZoomed((value) => !value)}
              className={`m-auto select-none duration-300 animate-in fade-in ${
                zoomed
                  ? "w-[220%] max-w-none cursor-zoom-out"
                  : "max-h-full max-w-full cursor-zoom-in object-contain"
              }`}
            />
          </div>

          <p className="pb-5 pt-3 text-center text-xs text-white/60">
            {zoomed ? "Tap the image to zoom out" : "Tap the image to zoom in"}
          </p>
        </div>

        {count > 1 && !zoomed && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              aria-label="Previous image"
              className={`${navButton} left-3`}
            >
              <ChevronLeft className="size-6" />
            </button>

            <button
              type="button"
              onClick={() => go(index + 1)}
              disabled={index === count - 1}
              aria-label="Next image"
              className={`${navButton} right-3`}
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Stacked card slider                                                        */
/* -------------------------------------------------------------------------- */

/** Width of the front card, as a share of the slider. */
const CARD_WIDTH = 0.62;
/** Drag distance for one card, as a share of the card width. */
const DRAG_UNIT = 0.35;

/**
 * Where a card sits, based on how far it is from the front (pos 0).
 * Cards behind get smaller, hazier and tuck further under the front one.
 */
function layout(pos: number) {
  const a = Math.abs(pos);
  const sign = pos < 0 ? -1 : 1;

  const x = a <= 1 ? 24 * a : a <= 2 ? 24 + 17 * (a - 1) : 41 + 8 * (a - 2);

  const scale = Math.max(
    0.55,
    a <= 1
      ? 1 - 0.12 * a
      : a <= 2
        ? 0.88 - 0.13 * (a - 1)
        : 0.75 - 0.1 * (a - 2),
  );

  const opacity =
    a <= 1
      ? 1 - 0.2 * a
      : a <= 2
        ? 0.8 - 0.35 * (a - 1)
        : Math.max(0, 0.45 - 0.45 * (a - 2));

  return {
    x: sign * x,
    scale,
    opacity,
    haze: Math.min(0.5, a * 0.28),
    z: 100 - Math.round(a * 20),
  };
}

const ARROW_BUTTON =
  "absolute top-1/2 z-[200] hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/80 text-neutral-800 shadow-lg backdrop-blur transition-all hover:scale-105 hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 disabled:pointer-events-none disabled:opacity-0 sm:flex";

export default function ImageSlider({ files }: { files: SubmissionFile[] }) {
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; moved: boolean } | null>(null);
  const unit = useRef(80);

  const [index, setIndex] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const count = files.length;
  const current = files[index] ?? files[0];
  const drive = current ? driveVisual(current.google_drive_status) : null;

  const goTo = useCallback(
    (next: number) => setIndex(Math.max(0, Math.min(count - 1, next))),
    [count],
  );

  /* ---- drag / swipe (mouse, touch and pen) ---- */

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (count < 2 || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    unit.current = (stage.current?.clientWidth ?? 300) * CARD_WIDTH * DRAG_UNIT;
    drag.current = { startX: event.clientX, moved: false };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;

    const delta = event.clientX - state.startX;

    // Small movements are taps, not drags.
    if (!state.moved) {
      if (Math.abs(delta) < 8) return;

      state.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }

    setDx(delta);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    drag.current = null;

    if (!state?.moved) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const delta = event.clientX - state.startX;
    const threshold = Math.min(60, unit.current * 0.6);

    setDragging(false);
    setDx(0);

    if (delta < -threshold) goTo(index + 1);
    else if (delta > threshold) goTo(index - 1);
  };

  const onPointerCancel = () => {
    drag.current = null;
    setDragging(false);
    setDx(0);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    }
  };

  // Don't let the browser's own image drag fight with ours.
  useEffect(() => {
    if (!dragging) return;

    const previous = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    return () => {
      document.body.style.userSelect = previous;
    };
  }, [dragging]);

  if (count === 0) return null;

  // Fraction of a card the stack has moved while dragging (with a soft stop at the ends).
  const atEdge = (index === 0 && dx > 0) || (index === count - 1 && dx < 0);
  const shift =
    Math.max(-1.2, Math.min(1.2, dx / unit.current)) * (atEdge ? 0.25 : 1);

  return (
    <div className="space-y-3">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Evidence images"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/30 py-6 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40"
      >
        {/* Glow that follows the front card */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {files.map((file, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={file.id}
              src={ambientSrc(file)}
              alt=""
              draggable={false}
              className={`absolute inset-0 size-full scale-150 object-cover blur-2xl saturate-150 transition-opacity duration-700 ${
                i === index ? "opacity-60" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-white/40" />
        </div>

        {/* Stack */}
        <div
          ref={stage}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          className={`relative touch-pan-y select-none ${
            count > 1 ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""
          }`}
        >
          {/* Gives the stack its height */}
          <div aria-hidden className="mx-auto aspect-[3/4] w-[62%]" />

          {files.map((file, i) => {
            const pos = i - index + shift;
            const place = layout(pos);
            const active = i === index;
            const motion = dragging
              ? ""
              : "transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

            return (
              <button
                key={file.id}
                type="button"
                tabIndex={active ? 0 : -1}
                aria-current={active}
                aria-label={`Image ${i + 1} of ${count}${
                  active ? ". Open full screen" : ""
                }`}
                onClick={() => (active ? setViewerOpen(true) : goTo(i))}
                className={`absolute left-1/2 top-0 block aspect-[3/4] w-[62%] overflow-hidden rounded-[1.75rem] border-2 border-white/80 shadow-[0_24px_44px_-20px_rgba(30,40,120,0.6)] will-change-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50 ${motion} ${
                  active ? "cursor-zoom-in" : ""
                }`}
                style={{
                  transform: `translateX(${-50 + place.x}%) scale(${place.scale})`,
                  opacity: place.opacity,
                  zIndex: place.z,
                  visibility: Math.abs(pos) > 2.6 ? "hidden" : "visible",
                }}
              >
                <CardFace
                  file={file}
                  index={i}
                  total={count}
                  eager={Math.abs(i - index) <= 2}
                />

                {/* Cards behind the front one look hazier */}
                <span
                  aria-hidden
                  className={`pointer-events-none absolute inset-0 bg-white ${
                    dragging ? "" : "transition-opacity duration-500"
                  }`}
                  style={{ opacity: place.haze }}
                />
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          aria-label="Open image full screen"
          className="absolute right-3 top-3 z-[200] flex size-8 items-center justify-center rounded-full bg-neutral-900/70 text-white backdrop-blur transition-colors hover:bg-neutral-900/90 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40"
        >
          <Maximize2 className="size-3.5" />
        </button>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label="Previous image"
              className={`${ARROW_BUTTON} left-2`}
            >
              <ChevronLeft className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index === count - 1}
              aria-label="Next image"
              className={`${ARROW_BUTTON} right-2`}
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {/* Position */}
      {count > 1 &&
        (count <= 10 ? (
          <div className="flex items-center justify-center gap-1.5">
            {files.map((file, i) => (
              <button
                key={file.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 ${
                  i === index
                    ? "w-6 bg-blue-500"
                    : "w-1.5 bg-neutral-300 hover:bg-neutral-400"
                }`}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-xs font-medium tabular-nums text-neutral-600">
            {index + 1} / {count}
          </p>
        ))}

      {/* Drive backup state for the image in front */}
      {drive && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 font-medium ${drive.text}`}
          >
            <span aria-hidden className={`size-2 rounded-full ${drive.dot}`} />
            {drive.label}
          </span>

          {current.google_drive_url && (
            <a
              href={current.google_drive_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
            >
              Open in Drive
            </a>
          )}
        </div>
      )}

      <Lightbox
        files={files}
        index={index}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        onChange={goTo}
      />
    </div>
  );
}
