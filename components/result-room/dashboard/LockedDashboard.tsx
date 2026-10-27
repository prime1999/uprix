"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CircleDollarSign,
  Headset,
  Hourglass,
  Lock,
  MessageSquareQuote,
  UserCog,
} from "lucide-react";

import GeneralButton from "@/components/miscelleneous/generalButton";
// Adjust these paths to match your project.
import { Icon3D } from "@/components/result-room/dashboard/fines/icon-3d";
import ComplaintDialog from "@/components/result-room/dashboard/help/comlaint-dialog";
import ComplaintSheet from "@/components/result-room/dashboard/help/complaints-sheet";

interface LockedDashboardProps {
  /** Why an admin locked it, if they gave a reason (participant.statusReason). */
  reason?: string | null;
  /** When it was locked (participant.statusChangedAt). */
  lockedAt?: string | null;
  /** Where unpaid fines are paid. Pass null to hide the button. */
  finesHref?: string | null;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Styles and helpers                                                         */
/* -------------------------------------------------------------------------- */

const GLASS =
  "border border-white/60 bg-white/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_-8px_rgba(60,70,160,0.25)]";

const GLASS_INNER = "border border-white/70 bg-white/30 backdrop-blur-md";

const formatDate = (value: string) => {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

/** Large screens get the Help Center as a dialog; smaller ones as a bottom sheet. */
function useIsDesktop(query = "(min-width: 1024px)") {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

const REASONS = [
  {
    icon: CircleDollarSign,
    tone: "amber",
    title: "Unpaid fines",
    text: "You have a fine that hasn't been paid yet.",
  },
  {
    icon: UserCog,
    tone: "violet",
    title: "Locked by admins",
    text: "An admin locked your dashboard after reviewing your account.",
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function LockedDashboard({
  reason,
  lockedAt,
  finesHref = "/result-room/dashboard/fines",
  className = "",
}: LockedDashboardProps) {
  const router = useRouter();
  const desktop = useIsDesktop();
  const [helpOpen, setHelpOpen] = useState(false);

  const adminReason = reason?.trim();
  const lockedOn = lockedAt ? formatDate(lockedAt) : null;

  return (
    <main
      className={`flex min-h-[75dvh] w-full items-center justify-center py-6 ${className}`}
    >
      <section
        aria-labelledby="locked-title"
        className={`relative w-full max-w-lg overflow-hidden rounded-3xl p-5 sm:p-8`}
      >
        {/* Soft light across the top of the glass */}
        <span aria-hidden />

        {/* Heading */}
        <header className="relative flex flex-col items-center text-center">
          <Icon3D icon={Lock} tone="red" size="xl" />

          <h1
            id="locked-title"
            className="mt-5 text-2xl font-semibold tracking-tight text-secondary-blue font-heading"
          >
            Your dashboard is locked
          </h1>

          <p className="mt-1 max-w-sm text-sm leading-relaxed text-neutral-600">
            You can&apos;t use the Result Room until it&apos;s unlocked.
            {lockedOn && (
              <span className="mt-1 block text-xs text-neutral-500">
                Locked on {lockedOn}
              </span>
            )}
          </p>
        </header>

        {/* Possible reasons */}
        <div className="relative mt-6">
          <h2 className="mb-2 text-sm font-semibold text-neutral-900">
            Possible reasons
          </h2>

          <ol
            className={`divide-y divide-white/60 rounded-2xl px-4 ${GLASS_INNER}`}
          >
            {REASONS.map((item, index) => (
              <li key={item.title} className="flex items-start gap-3 py-3.5">
                <Icon3D icon={item.icon} tone={item.tone} size="sm" />

                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-neutral-900">
                    <span className="mr-1.5 tabular-nums text-neutral-400">
                      {index + 1}.
                    </span>
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">
                    {item.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* The admin's own words, when they gave a reason */}
        {adminReason && (
          <div
            className={`relative mt-3 flex items-start gap-3 rounded-2xl px-4 py-3.5 ${GLASS_INNER}`}
          >
            <Icon3D icon={MessageSquareQuote} tone="blue" size="sm" />

            <div className="min-w-0 pt-0.5">
              <p className="text-xs text-neutral-500">Reason from the admin</p>
              <p className="mt-0.5 whitespace-pre-line break-words text-sm leading-relaxed text-neutral-900">
                {adminReason}
              </p>
            </div>
          </div>
        )}

        {/* Think it's a mistake? */}
        <div
          className={`relative mt-3 flex items-start gap-3 rounded-2xl px-4 py-3.5 ${GLASS_INNER}`}
        >
          <Icon3D icon={Headset} tone="blue" size="sm" />

          <p className="min-w-0 pt-0.5 text-sm leading-relaxed text-neutral-700">
            If you think this dashboard was locked inappropriately, please raise
            a complaint in the{" "}
            <span className="font-semibold text-neutral-900">Help Center</span>{" "}
            on the dashboard.
          </p>
        </div>

        {/* Eviction warning */}
        <div
          role="note"
          className="relative mt-3 flex items-start gap-3 rounded-2xl border border-amber-300/70 bg-amber-100/60 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-md"
        >
          <Icon3D icon={Hourglass} tone="amber" size="sm" />

          <p className="min-w-0 pt-0.5 text-sm font-medium leading-relaxed text-amber-950">
            Your locked dashboard will be up for eviction after 36 hours of no
            activity.
          </p>
        </div>

        {/* Actions */}
        <div className="relative mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
          {finesHref && (
            <GeneralButton
              className="w-full sm:w-auto"
              buttonFunction={() => router.push(finesHref)}
            >
              <CircleDollarSign />
              View fines
            </GeneralButton>
          )}

          <GeneralButton
            variant="active"
            className="w-full sm:w-auto"
            buttonFunction={() => setHelpOpen(true)}
          >
            <Headset />
            Open Help Center
          </GeneralButton>
        </div>
      </section>

      {/* The same complaint form as the sidebar's Help Center */}
      {desktop ? (
        <ComplaintDialog open={helpOpen} onOpenChange={setHelpOpen} />
      ) : (
        <ComplaintSheet open={helpOpen} onOpenChange={setHelpOpen} />
      )}
    </main>
  );
}
