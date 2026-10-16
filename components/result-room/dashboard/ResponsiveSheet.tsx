"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const EXIT_MS = 280;
const DISMISS_DRAG = 110;

const PANEL_GLASS =
  "border border-white/70 bg-white/60 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(255,255,255,0.4),0_30px_80px_-20px_rgba(60,70,160,0.5)]";

interface ResponsiveSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Centered modal from `md` up, bottom sheet below it.
 * Esc / backdrop click closes, body scroll is locked, and on mobile the
 * sheet can be dragged down from its handle.
 */
export default function ResponsiveSheet({
  open,
  onClose,
  title,
  children,
}: ResponsiveSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startY = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  // Mount, then animate in; animate out, then unmount.
  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setMounted(true);

      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => {
          setVisible(true);
          panelRef.current?.focus();
        });
      });

      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }

    setVisible(false);
    setDragY(0);

    const timer = setTimeout(() => {
      setMounted(false);
      returnFocus.current?.focus();
    }, EXIT_MS);

    return () => clearTimeout(timer);
  }, [open]);

  // Esc to close + lock page scroll while open.
  useEffect(() => {
    if (!mounted) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [mounted, onClose]);

  const onDragStart = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    startY.current = event.clientY;
    setDragging(true);
  };

  const onDragMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragY(Math.max(0, event.clientY - startY.current));
  };

  const onDragEnd = () => {
    if (!dragging) return;
    setDragging(false);

    if (dragY > DISMISS_DRAG) onClose();
    else setDragY(0);
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 bg-indigo-950/30 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
        className={`relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[2rem] outline-none md:max-h-[80dvh] md:max-w-sm md:rounded-3xl ${PANEL_GLASS} ${
          dragging
            ? ""
            : "transition-all duration-300 ease-out motion-reduce:transition-none"
        } ${
          visible
            ? "translate-y-0 opacity-100 md:scale-100"
            : "translate-y-full opacity-0 md:translate-y-4 md:scale-95"
        }`}
      >
        {/* Drag handle (mobile only) */}
        <div
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          className="flex shrink-0 cursor-grab touch-none justify-center pb-1 pt-3 active:cursor-grabbing md:hidden"
        >
          <span className="h-1.5 w-10 rounded-full bg-neutral-400/50 shadow-[inset_0_1px_0_rgba(0,0,0,0.08)]" />
        </div>

        <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-3 md:px-6 md:pt-5">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full border border-white/80 bg-gradient-to-b from-white to-white/50 text-neutral-600 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_10px_-4px_rgba(60,70,160,0.35)] transition active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
