"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import GeneralButton from "@/components/miscelleneous/generalButton";

/* -------------------------------------------------------------------------- */
/* Small hooks                                                                */
/* -------------------------------------------------------------------------- */

function useOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}

/** normal -> slow (8s) -> stuck (20s). Only runs while the screen is mounted. */
function useLoadingStage(enabled: boolean) {
  const [stage, setStage] = useState<"normal" | "slow" | "stuck">("normal");

  useEffect(() => {
    if (!enabled) return;

    const slow = window.setTimeout(() => setStage("slow"), 8000);
    const stuck = window.setTimeout(() => setStage("stuck"), 20000);

    return () => {
      window.clearTimeout(slow);
      window.clearTimeout(stuck);
    };
  }, [enabled]);

  return stage;
}

/* -------------------------------------------------------------------------- */
/* Loading screen                                                             */
/* -------------------------------------------------------------------------- */

type UprixLoadingScreenProps = {
  /** Tagline shown while everything is going normally. */
  message?: string;
  /**
   * Wait this long before showing anything, so quick loads never flash a
   * splash screen. Use 0 for the app-launch splash.
   */
  delayMs?: number;
  /**
   * If loading drags on, say so, and offer a Reload button.
   * Turn off for short, timed splashes.
   */
  escalate?: boolean;
  /** Preload the logo. Leave on for loading.tsx; turn off for the launch overlay. */
  priority?: boolean;
};

export function UprixLoadingScreen({
  message = "Evolve Upward",
  delayMs = 200,
  escalate = true,
  priority = true,
}: UprixLoadingScreenProps) {
  const online = useOnline();
  const stage = useLoadingStage(escalate);

  const status = !online
    ? "You're offline. We'll carry on when you're back."
    : stage === "stuck"
      ? "This is taking longer than usual."
      : stage === "slow"
        ? "Still loading. Your connection may be slow."
        : null;

  const showReload = online && stage === "stuck";

  return (
    <div
      className="uprix-splash"
      style={{ "--uprix-delay": `${delayMs}ms` } as CSSProperties}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading Uprix"
    >
      <div className="flex flex-col items-center justify-center px-4 text-center">
        {/* The lockup: icon on the left, wordmark and tagline on the right */}
        <div className="uprix-lockup">
          <div className="uprix-splash-logo-wrap">
            <Image
              src="/logo/logo-512x512.png"
              alt="Uprix logo"
              width={88}
              height={88}
              priority={priority}
              className="uprix-splash-logo object-contain"
            />
            {/* A light sweep that only shows on the icon's own shape */}
            <span className="uprix-icon-shine" aria-hidden="true" />
          </div>

          <div className="uprix-lockup-text">
            {/*
              Each letter flips up out of a mask, one after another.
              The x, with its long swash, sweeps in last and catches the light.
            */}
            <p className="uprix-splash-wordmark">
              <span className="sr-only">Uprix</span>

              {"Upri".split("").map((letter, index) => (
                <span
                  key={index}
                  className="uprix-letter-mask"
                  aria-hidden="true"
                >
                  <span
                    className="uprix-letter uprix-wordmark-main"
                    style={{ "--i": index } as CSSProperties}
                  >
                    {letter}
                  </span>
                </span>
              ))}

              <span className="uprix-wordmark-x" aria-hidden="true">
                x
              </span>
            </p>

            <p className="uprix-splash-tagline" aria-label={message}>
              {message.split(" ").map((word, index) => (
                <span
                  key={index}
                  className="uprix-word-mask"
                  aria-hidden="true"
                >
                  <span
                    className="uprix-word"
                    style={{ "--w": index } as CSSProperties}
                  >
                    {word}
                  </span>
                </span>
              ))}
            </p>
          </div>
        </div>

        {status && (
          // key restarts the fade when the message changes
          <p key={status} className="uprix-splash-status">
            {status}
          </p>
        )}

        {showReload ? (
          <GeneralButton
            text="Reload"
            variant="reset"
            className="mt-5"
            buttonFunction={() => window.location.reload()}
          />
        ) : (
          <div className="uprix-splash-bar" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Launch splash (installed app only)                                         */
/* -------------------------------------------------------------------------- */

/** Long enough for the unveiling animation to finish (about 1.8s). */
const MIN_VISIBLE_MS = 1800;
/** Never keep the splash longer than this, whatever the page is doing. */
const MAX_VISIBLE_MS = 3500;
const FADE_MS = 300;

/**
 * Shows the splash while the installed app opens, then fades it out.
 *
 * The overlay is in the server HTML but hidden by CSS unless the app is
 * running as an installed PWA (see .uprix-launch-overlay). That means it is
 * on screen from the very first paint, with no flash of app content before
 * it. Once the animation has played and the page and fonts are ready, it
 * fades away.
 */
export function AppLaunchSplash({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"visible" | "leaving" | "gone">("visible");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    // Ordinary browser visit: remove the (hidden) overlay straight away.
    if (!standalone) {
      setPhase("gone");
      return;
    }

    let cancelled = false;
    let left = false;
    const timers: number[] = [];

    const leave = () => {
      if (cancelled || left) return;
      left = true;

      setPhase("leaving");
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) setPhase("gone");
        }, FADE_MS),
      );
    };

    const loaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((resolve) =>
            window.addEventListener("load", () => resolve(), { once: true }),
          );

    const fontsReady = document.fonts?.ready ?? Promise.resolve();

    const minimum = new Promise<void>((resolve) => {
      timers.push(window.setTimeout(resolve, MIN_VISIBLE_MS));
    });

    void Promise.all([loaded, fontsReady, minimum]).then(leave);

    // Safety net.
    timers.push(window.setTimeout(leave, MAX_VISIBLE_MS));

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <>
      {children}

      {phase !== "gone" && (
        <div
          className={`uprix-launch-overlay ${phase === "leaving" ? "is-leaving" : ""}`}
        >
          <UprixLoadingScreen
            message="Evolve Upward"
            delayMs={0}
            escalate={false}
            priority={false}
          />
        </div>
      )}
    </>
  );
}
