"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, CircleDollarSign, Settings, Pencil } from "lucide-react";
import goGetter from "@/app/assets/images/goGetter.jpg";
import { useResultRoomDashboard } from "@/lib/queries/result-room";
import SecondaryButton from "@/components/miscelleneous/secondaryButton";
import GeneralButton from "@/components/miscelleneous/generalButton";
import EditProfileModal from "@/components/result-room/dashboard/modals/EditProfileModal";
import AvatarImage from "@/components/result-room/dashboard/AvatarImage";

const FINES_HREF = "/result-room/dashboard/fines";

/** The fines icon and its count turn red from this many fines (more than 1). */
const RED_FROM = 2;

/** The countdown pulses in the last stretch. */
const URGENT_MS = 10 * 60 * 1000;

/**
 * The countdown is orange at (or beyond) this much time left and shifts to
 * red as the deadline gets closer. 48h matches the fallback deadline.
 */
const COLOR_SPAN_MS = 48 * 60 * 60 * 1000;

/** Orange (hue 30) -> red (hue 0) as the time left runs down. */
const countdownColor = (msLeft: number) => {
  const left = Math.min(Math.max(msLeft / COLOR_SPAN_MS, 0), 1);

  return `hsl(${Math.round(left * 30)} 92% 47%)`;
};

/** One unpaid fine, as the dashboard API returns it. */
type DashboardFine = {
  id: string;
  /** The deadline that is enforced (due_at, or created_at + 48h). */
  effectiveDueAt: string;
};

type Accountability = {
  unpaidFineCount?: number;
  totalFineCount?: number;
  /** Unpaid fines only. */
  fines?: DashboardFine[];
};

/**
 * Splits the time left into labelled parts, leaving out leading units that
 * are zero:
 *   2 days 4 hrs 12 mins 9 secs
 *   4 hrs 12 mins 9 secs
 *   12 mins 9 secs
 *   9 secs
 */
const countdownParts = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));

  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const unit = (
    key: "days" | "hrs" | "mins" | "secs",
    value: number,
    one: string,
    many: string,
  ) => ({
    key,
    value,
    label: value === 1 ? one : many,
  });

  const parts = [
    unit("days", days, "day", "days"),
    unit("hrs", hours, "hr", "hrs"),
    unit("mins", minutes, "min", "mins"),
    unit("secs", seconds, "sec", "secs"),
  ];

  // Drop only the leading zero units; zeros in the middle stay.
  // At zero, show "0 secs".
  const first = parts.findIndex((part) => part.value > 0);

  return parts.slice(first === -1 ? 3 : first);
};

/** "2 days 4 hr", "4 hr 12 min", "12 min" for the link's label. */
const describeWait = (ms: number) => {
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  if (days > 0) return `${days} ${days === 1 ? "day" : "days"} ${hours} hr`;
  if (hours > 0) return `${hours} hr ${mins} min`;

  return `${mins} min`;
};

/**
 * Counts down to the next unpaid fine that is due (the one that will lock the
 * dashboard first). Ticks once a second, only while a deadline is still ahead.
 * When a deadline passes, onExpire runs once so the dashboard can reload and
 * show the locked state.
 */
function useNextFineCountdown(
  fines: DashboardFine[] | undefined,
  onExpire: () => void,
) {
  const deadlines = useMemo(
    () =>
      (fines ?? [])
        .map((fine) => new Date(fine.effectiveDueAt).getTime())
        .filter((time) => Number.isFinite(time)),
    [fines],
  );

  // Start with null so prerendering does not evaluate Date.now().
  const [now, setNow] = useState<number | null>(null);

  // Deadlines that were still ahead when we first saw them. Only those fire
  // onExpire, so fines that were already overdue on load don't trigger it.
  const watching = useRef(new Set<number>());
  const expire = useRef(onExpire);

  useEffect(() => {
    expire.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const current = Date.now();

    setNow(current);

    deadlines.forEach((time) => {
      if (time > current) watching.current.add(time);
    });

    if (!deadlines.some((time) => time > current)) return;

    const id = window.setInterval(() => {
      const tick = Date.now();

      setNow(tick);

      let fired = false;

      watching.current.forEach((time) => {
        if (time <= tick) {
          watching.current.delete(time);
          fired = true;
        }
      });

      if (fired) expire.current();

      if (!deadlines.some((time) => time > tick)) {
        window.clearInterval(id);
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [deadlines]);

  // Don't calculate the countdown until the client has supplied the time.
  const upcoming = now === null ? [] : deadlines.filter((time) => time > now);

  const next = upcoming.length ? Math.min(...upcoming) : null;

  return next === null || now === null ? null : next - now;
}

const Topbar = () => {
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);
  const { data: dashboardData, refetch } = useResultRoomDashboard();
  const router = useRouter();

  /* Fines */
  const accountability = dashboardData?.accountability as
    | Accountability
    | undefined;

  // `fines` holds the unpaid ones. totalFineCount also counts paid fines, so
  // it is only a last fallback.
  const fineCount =
    accountability?.fines?.length ??
    accountability?.unpaidFineCount ??
    accountability?.totalFineCount ??
    0;

  const finesRed = fineCount >= RED_FROM;
  const badgeText = fineCount > 9 ? "9+" : String(fineCount);

  // Time left until the next fine is due (null when none is coming up).
  const reloadDashboard = useCallback(() => {
    void refetch();
  }, [refetch]);

  const msLeft = useNextFineCountdown(accountability?.fines, reloadDashboard);

  // Shown whenever an unpaid fine is still ahead of its deadline.
  const countdownMs = msLeft;
  const urgent = countdownMs !== null && countdownMs <= URGENT_MS;

  // Unpaid fines exist, but every one is already past its deadline.
  const pastDue =
    (accountability?.fines?.length ?? 0) > 0 && countdownMs === null;

  const finesLabel =
    (fineCount === 0
      ? "Fines: none"
      : `Fines: ${fineCount} ${fineCount === 1 ? "fine" : "fines"}`) +
    // Rounded to the minute, so a screen reader isn't told about every second.
    (countdownMs !== null ? `. Next due in ${describeWait(countdownMs)}` : "");

  return (
    <nav className="flex items-center justify-between w-full gap-2">
      <h2 className="text-md font-semibold font-heading">Dashboard</h2>

      <div className="flex items-center gap-4 sm:gap-6">
        {/* Fines: visible on every screen size, with a count when there are any */}
        <Link
          href={FINES_HREF}
          aria-label={finesLabel}
          title={finesLabel}
          className={`flex flex-row-reverse items-center gap-2 transition-colors ${
            finesRed ? "text-red-600" : "hover:text-secondary-blue"
          }`}
        >
          {/* Icon and badge wrapper */}
          <div className="relative flex items-center justify-center">
            <CircleDollarSign size={15} />

            {fineCount > 0 && (
              <span
                aria-hidden
                className={`absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full border px-1 text-[10px] font-bold leading-none tabular-nums text-white ${
                  finesRed
                    ? "border-red-400/80 bg-gradient-to-b from-red-400 to-red-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_6px_-1px_rgba(239,68,68,0.55)]"
                    : "border-blue-400/80 bg-gradient-to-b from-blue-400 to-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_6px_-1px_rgba(59,130,246,0.5)]"
                }`}
              >
                {badgeText}
              </span>
            )}
          </div>

          {/* Countdown timer beside the icon */}
          {(countdownMs !== null || pastDue) && (
            <span
              aria-hidden
              style={{ color: countdownColor(countdownMs ?? 0) }}
              className={`pointer-events-none flex items-center gap-1.5 whitespace-nowrap leading-none ${
                urgent ? "animate-pulse motion-reduce:animate-none" : ""
              }`}
            >
              {countdownParts(countdownMs ?? 0).map((part) => (
                <span
                  key={part.key}
                  className="flex min-w-4 flex-col items-center"
                >
                  <span className="text-[11px] font-bold tabular-nums">
                    {part.key === "days"
                      ? part.value
                      : String(part.value).padStart(2, "0")}
                  </span>
                  <span className="mt-0.5 text-[8px] font-medium opacity-80">
                    {part.label}
                  </span>
                </span>
              ))}
            </span>
          )}
        </Link>

        <button
          type="button"
          aria-label="Notifications"
          className="hidden md:block"
        >
          <Bell size={15} />
        </button>

        <button type="button" aria-label="Settings" className="hidden md:block">
          <Settings size={15} />
        </button>

        {/* Divider */}
        <p aria-hidden className="font-bold">
          |
        </p>

        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger className="flex items-center gap-1">
            <h3 className="text-sm font-medium">Go Getter</h3>

            {/* avatar_url is a built-in key ("male-1"), a URL, or empty */}
            <AvatarImage
              value={dashboardData?.profile?.avatar_url}
              fallback={goGetter}
              alt={dashboardData?.profile?.name ?? "Go Getter"}
              sizes="32px"
              className="size-8 rounded-full border border-white object-cover"
            />
          </PopoverTrigger>

          <PopoverContent className="backdrop-blur-3xl bg-transparent border-2 border-white mr-4">
            <PopoverHeader>
              <PopoverTitle className="text-sm font-semibold capitalize flex items-center justify-between">
                <span>{dashboardData && dashboardData.profile?.name}</span>

                <SecondaryButton
                  onClick={() => {
                    // Close the popover first so its heavy blur isn't
                    // stacked underneath the modal.
                    setPopoverOpen(false);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="text-white" />
                </SecondaryButton>
              </PopoverTitle>

              {dashboardData && dashboardData !== null ? (
                <div className="text-sm text-muted-foreground">
                  <div className="w-full flex flex-col gap-2">
                    <div>
                      <p className="text-xs text-gray-800">Goal</p>
                      <h6 className="text-xs font-normal">
                        {dashboardData?.participant?.goal}
                      </h6>
                    </div>

                    <div>
                      <p className="text-xs text-gray-800">Email</p>
                      <h6 className="text-xs font-normal">
                        {dashboardData?.participant?.email}
                      </h6>
                    </div>

                    <div>
                      <p className="text-xs text-gray-800">Phone-Number</p>
                      <h6 className="text-xs font-normal">
                        {dashboardData?.participant?.phone}
                      </h6>
                    </div>
                  </div>

                  <div className="mt-4">
                    <GeneralButton
                      text="View Profile"
                      onClick={() => router.push("/protected")}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm font-normal">Loading...</p>
              )}
            </PopoverHeader>
          </PopoverContent>
        </Popover>

        <EditProfileModal
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={{
            full_name: dashboardData?.profile?.name ?? null,
            avatar_url: dashboardData?.profile?.avatar_url ?? null,
            goal: dashboardData?.participant?.goal ?? null,
            email: dashboardData?.participant?.email ?? null,
            phone: dashboardData?.participant?.phone ?? null,
            gender: dashboardData?.profile?.gender ?? null,
          }}
        />
      </div>
    </nav>
  );
};

export default Topbar;
