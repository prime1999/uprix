"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Headset,
  Settings,
  Bell,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import ComplaintSheet from "@/components/result-room/dashboard/help/complaints-sheet";

export interface MobileNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match the path exactly instead of by prefix (use for the root item). */
  exact?: boolean;
  /**
   * Makes the item a button that opens something instead of a link.
   * "help" opens the complaint sheet. `href` is then only a unique key.
   */
  action?: "help";
}

// Edit these to match your real routes. Keep it to about 4 or 5 items.
const DEFAULT_ITEMS: MobileNavItem[] = [
  {
    label: "Overview",
    href: "/result-room/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Notifications",
    href: "/result-room/dashboard/notifications",
    icon: Bell,
  },
  {
    label: "Help Center",
    href: "/result-room/dashboard/help",
    icon: Headset,
    action: "help",
  },
  {
    label: "Settings",
    href: "/result-room/dashboard/settings",
    icon: Settings,
  },
];

// size-14 buttons (56px) with a gap-2 (8px) between them
const BUTTON = 56;
const GAP = 8;

const ITEM_CLASS =
  "group relative flex size-14 items-center justify-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40";

export default function MobileNav({
  items = DEFAULT_ITEMS,
  hideDelay = 3000,
  className = "",
}: {
  items?: MobileNavItem[];
  /** Milliseconds after scrolling stops before the bar hides. */
  hideDelay?: number;
  className?: string;
}) {
  const pathname = usePathname();

  /** Whether the Help Center sheet is open. */
  const [helpOpen, setHelpOpen] = useState(false);

  /**
   * The blue puck sits on the item for the page you're on. While the Help
   * Center is open it moves to Help instead, and slides back when it closes.
   * Button items (like Help) are never matched by the path.
   */
  const helpIndex = items.findIndex((item) => item.action === "help");

  const pathIndex = items.findIndex(
    (item) =>
      !item.action &&
      (item.exact ? pathname === item.href : pathname.startsWith(item.href)),
  );

  const activeIndex = helpOpen && helpIndex !== -1 ? helpIndex : pathIndex;
  const hasActive = activeIndex !== -1;

  /* ------------------------------------------------------------------ */
  /*  Auto-hide: slides away hideDelay ms after scrolling stops and      */
  /*  slides back as soon as any scrolling starts                        */
  /* ------------------------------------------------------------------ */

  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // true while a finger is on the bar or it has keyboard focus
  const interacting = useRef(false);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearTimer();
    timer.current = setTimeout(function tryHide() {
      // never hide while the user is touching or focused on the bar
      if (interacting.current) {
        timer.current = setTimeout(tryHide, 1000);
        return;
      }
      setVisible(false);
    }, hideDelay);
  }, [clearTimer, hideDelay]);

  useEffect(() => {
    const onScroll = () => {
      setVisible(true);
      scheduleHide();
    };
    // capture: true also catches scrolling inside inner scroll containers
    window.addEventListener("scroll", onScroll, {
      passive: true,
      capture: true,
    });
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      clearTimer();
    };
  }, [scheduleHide, clearTimer]);

  // a new page always shows the bar; it hides again after the next scroll
  useEffect(() => {
    setVisible(true);
    clearTimer();
  }, [pathname, clearTimer]);

  return (
    <>
      <nav
        aria-label="Primary"
        aria-hidden={!visible}
        onPointerDown={() => (interacting.current = true)}
        onPointerUp={() => (interacting.current = false)}
        onPointerCancel={() => (interacting.current = false)}
        onFocus={(e) => {
          // keyboard focus only, so a tapped link does not keep the bar open
          if (e.target.matches(":focus-visible")) interacting.current = true;
        }}
        onBlur={() => (interacting.current = false)}
        className={`fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4 transition-all duration-500 ease-out motion-reduce:transition-none md:hidden ${
          visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none invisible translate-y-[calc(100%+2rem)] opacity-0"
        } ${className}`}
      >
        {/* glass bar. isolate keeps the layers below stacked inside it */}
        <ul className="relative isolate flex items-center gap-2 rounded-full border border-white/50 bg-white/30 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_12px_40px_-12px_rgba(80,60,160,0.4)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_12px_40px_-12px_rgba(0,0,0,0.6)]">
          {/* the 3D blue button: one puck that slides to the active item */}
          <span
            aria-hidden
            className={`pointer-events-none absolute left-2 top-2 z-10 size-14 overflow-hidden rounded-full border border-blue-400/80 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_8px_16px_-6px_rgba(59,130,246,0.6)] transition-all duration-500 ease-[cubic-bezier(.34,1.4,.64,1)] motion-reduce:transition-none ${
              hasActive ? "scale-100 opacity-100" : "scale-75 opacity-0"
            }`}
            style={{
              transform: `translateX(${Math.max(activeIndex, 0) * (BUTTON + GAP)}px)`,
            }}
          >
            {/* glossy highlight on the top half */}
            <span className="absolute inset-x-[10%] top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/50 to-transparent" />
          </span>

          {items.map((item, index) => {
            const active = index === activeIndex;
            const Icon = item.icon;

            // the same look for links and for the Help button
            const face = (
              <>
                {/* frosted circle behind each icon */}
                <span
                  aria-hidden
                  className="absolute inset-0 z-0 rounded-full border border-white/60 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_-4px_rgba(80,60,160,0.25)] transition-colors duration-200 group-hover:bg-white/60 dark:border-white/10 dark:bg-white/10 dark:shadow-none dark:group-hover:bg-white/20"
                />
                <Icon
                  strokeWidth={1.75}
                  className={`relative z-20 size-6 transition-all duration-300 group-active:scale-90 motion-reduce:transition-none ${
                    active
                      ? "scale-105 text-white"
                      : "text-neutral-800 group-hover:-translate-y-0.5 dark:text-neutral-100"
                  }`}
                />
              </>
            );

            return (
              <li key={item.href}>
                {item.action === "help" ? (
                  <button
                    type="button"
                    onClick={() => setHelpOpen(true)}
                    aria-label={item.label}
                    aria-haspopup="dialog"
                    aria-expanded={helpOpen}
                    className={ITEM_CLASS}
                  >
                    {face}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={ITEM_CLASS}
                  >
                    {face}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/*
        Outside the <nav> on purpose: the nav slides away and becomes
        invisible when you stop scrolling, and the sheet must not.
      */}
      <ComplaintSheet open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
