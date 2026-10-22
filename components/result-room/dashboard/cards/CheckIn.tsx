"use client";

import type { ReactNode } from "react";

import {
  Clock,
  Eye,
  FileCheck,
  Lock,
  Plus,
  SquarePen,
  Users,
  type LucideIcon,
} from "lucide-react";

import GeneralButton from "@/components/miscelleneous/generalButton";
// Adjust this path to wherever you keep icon-3d.tsx.
import {
  Icon3D,
  type Tone,
} from "@/components/result-room/dashboard/fines/icon-3d";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/** loading = we don't know the time yet, so we can't say if the window is open. */
export type WindowState = "loading" | "open" | "closed";

type CardState = "done" | "todo" | "closed" | "loading";

interface CheckInProps {
  /** Has today's submission / report already been sent? */
  completed: boolean;
  window: WindowState;
  /** e.g. "2h 10m". Only shown while the window is open. */
  countdown: string | null;
  /** Start a new one (the "Submit" button). */
  onSubmit: () => void;
  onView?: () => void;
  /** Update is only offered while the window is still open. */
  onEdit?: () => void;
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const GLASS =
  "border border-white/60 bg-white/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_-8px_rgba(60,70,160,0.25)]";

const GLASS_INNER = "border border-white/70 bg-white/30 backdrop-blur-md";

/** Small 3D status pills: gradient, top highlight line, soft glow. */
const PILL: Record<CardState, { label: string; className: string }> = {
  done: {
    label: "Done",
    className:
      "border-emerald-400/80 bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_6px_-1px_rgba(16,185,129,0.5)]",
  },
  todo: {
    label: "To do",
    className:
      "border-amber-300/80 bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_2px_6px_-1px_rgba(245,158,11,0.5)]",
  },
  closed: {
    label: "Closed",
    className: "border-white/70 bg-white/50 text-neutral-700 backdrop-blur-md",
  },
  loading: {
    label: "Checking",
    className: "border-white/70 bg-white/50 text-neutral-500 backdrop-blur-md",
  },
};

/* -------------------------------------------------------------------------- */
/* Shared card                                                                */
/* -------------------------------------------------------------------------- */

function CheckInCard({
  icon,
  tone,
  title,
  subtitle,
  state,
  statusLabel,
  message,
  countdown,
  footnote,
  children,
}: {
  icon: LucideIcon;
  /** Colour of the icon while there is something to do. */
  tone: Tone;
  title: string;
  subtitle: string;
  state: CardState;
  /** Overrides the default pill text. */
  statusLabel?: string;
  message: string;
  countdown?: string | null;
  footnote?: string;
  children: ReactNode;
}) {
  const pill = PILL[state];

  // Green when done, grey when closed, otherwise the card's own colour.
  const iconTone: Tone =
    state === "done" ? "emerald" : state === "closed" ? "slate" : tone;

  return (
    <article className={`flex h-full flex-col rounded-3xl p-4 sm:p-5 ${GLASS}`}>
      <header className="flex items-start gap-3">
        <Icon3D icon={icon} tone={iconTone} size="lg" />

        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-secondary-blue">
            {title}
          </h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${pill.className}`}
        >
          {statusLabel ?? pill.label}
        </span>
      </header>

      <div className={`mt-4 flex-1 rounded-2xl p-4 ${GLASS_INNER}`}>
        <p className="text-sm leading-relaxed text-neutral-800">{message}</p>

        {countdown && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium tabular-nums text-amber-800">
            <Clock className="size-3.5" />
            Closes in {countdown}
          </p>
        )}

        {footnote && (
          <p className="mt-2 text-xs text-neutral-500">{footnote}</p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2.5">{children}</div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* The buttons                                                                */
/* -------------------------------------------------------------------------- */

function CardButtons({
  completed,
  window,
  submitLabel,
  closedLabel,
  viewLabel,
  editLabel,
  onSubmit,
  onView,
  onEdit,
}: {
  completed: boolean;
  window: WindowState;
  submitLabel: string;
  closedLabel: string;
  viewLabel: string;
  editLabel: string;
  onSubmit: () => void;
  onView?: () => void;
  onEdit?: () => void;
}) {
  if (completed) {
    return (
      <>
        <GeneralButton
          className="h-10 flex-1"
          buttonFunction={onView}
          aria-label={viewLabel}
        >
          <Eye />
          View
        </GeneralButton>

        {/*
          The update button: icon only, right after View. Changing it is
          only allowed while today's window is open. (GeneralButton makes a
          button with a single icon and no text a round 40px icon button.)
        */}
        {window === "open" && onEdit && (
          <GeneralButton
            variant="active"
            buttonFunction={onEdit}
            aria-label={editLabel}
            title={editLabel}
          >
            <SquarePen />
          </GeneralButton>
        )}
      </>
    );
  }

  if (window === "open") {
    return (
      <GeneralButton
        variant="active"
        className="h-10 flex-1"
        buttonFunction={onSubmit}
      >
        <Plus />
        {submitLabel}
      </GeneralButton>
    );
  }

  return (
    <GeneralButton variant="disabled" className="h-10 flex-1" disabled>
      <Lock />
      {window === "loading" ? submitLabel : closedLabel}
    </GeneralButton>
  );
}

const stateOf = (completed: boolean, window: WindowState): CardState =>
  completed
    ? "done"
    : window === "loading"
      ? "loading"
      : window === "open"
        ? "todo"
        : "closed";

/* -------------------------------------------------------------------------- */
/* Task submission                                                            */
/* -------------------------------------------------------------------------- */

export function TaskSubmissionCard({
  completed,
  window,
  countdown,
  onSubmit,
  onView,
  onEdit,
}: CheckInProps) {
  const state = stateOf(completed, window);

  const message = completed
    ? "Well done! Today's evidence is in."
    : window === "open"
      ? "Done with your task? Add your evidence before the day ends."
      : window === "closed"
        ? "Today's submission window is closed."
        : "Checking today's submission window...";

  return (
    <CheckInCard
      icon={FileCheck}
      tone="blue"
      title="Task Submission"
      subtitle="Evidence of what you worked on"
      state={state}
      statusLabel={completed ? "Submitted" : undefined}
      message={message}
      countdown={!completed && window === "open" ? countdown : null}
      footnote={
        !completed && window === "closed"
          ? "Submissions closed at 9:00 PM."
          : undefined
      }
    >
      <CardButtons
        completed={completed}
        window={window}
        submitLabel="Submit task"
        closedLabel="Submission closed"
        viewLabel="View your submission"
        editLabel="Update your submission"
        onSubmit={onSubmit}
        onView={onView}
        onEdit={onEdit}
      />
    </CheckInCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Partner check                                                              */
/* -------------------------------------------------------------------------- */

export function PartnerCheckCard({
  completed,
  window,
  countdown,
  onSubmit,
  onView,
  onEdit,
}: CheckInProps) {
  const state = stateOf(completed, window);

  const message = completed
    ? "Partner check completed. Thanks for looking out for your partner."
    : window === "open"
      ? "Check on your partner? Write your report for today."
      : window === "closed"
        ? "Partner reporting is closed."
        : "Checking today's reporting window...";

  return (
    <CheckInCard
      icon={Users}
      tone="violet"
      title="Partner Check"
      subtitle="Look out for your partner"
      state={state}
      statusLabel={completed ? "Sent" : undefined}
      message={message}
      countdown={!completed && window === "open" ? countdown : null}
      footnote={
        !completed && window === "closed"
          ? "Reports closed at 9:30 PM."
          : undefined
      }
    >
      <CardButtons
        completed={completed}
        window={window}
        submitLabel="Submit report"
        closedLabel="Report closed"
        viewLabel="View your report"
        editLabel="Update your report"
        onSubmit={onSubmit}
        onView={onView}
        onEdit={onEdit}
      />
    </CheckInCard>
  );
}
