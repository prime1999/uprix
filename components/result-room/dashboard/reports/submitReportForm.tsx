"use client";

import { useState } from "react";
import {
  Check,
  CircleCheck,
  CircleX,
  MessageSquareText,
  X,
  type LucideIcon,
} from "lucide-react";

import GeneralButton from "@/components/miscelleneous/generalButton";
// Adjust this path to wherever you keep icon-3d.tsx.
import {
  Icon3D,
  type Tone,
} from "@/components/result-room/dashboard/fines/icon-3d";

interface SubmitReportFormProps {
  onSubmit: (payload: {
    comment: string;
    submittedOnTime: boolean;
  }) => void | Promise<void>;
  onCancel?: () => void;
  submitting?: boolean;
  maxLength?: number;
}

type Choice = "yes" | "no";

const GLASS =
  "border border-white/60 bg-white/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_-8px_rgba(60,70,160,0.25)]";

const GLASS_INNER = "border border-white/70 bg-white/30 backdrop-blur-md";

/* -------------------------------------------------------------------------- */
/* One answer box                                                             */
/* -------------------------------------------------------------------------- */

const OPTION: Record<
  Choice,
  {
    icon: LucideIcon;
    tone: Tone;
    title: string;
    subtitle: string;
    selected: string;
    badge: string;
  }
> = {
  yes: {
    icon: CircleCheck,
    tone: "emerald",
    title: "Yes",
    subtitle: "They submitted on time",
    selected:
      "border-emerald-300 bg-white/85 ring-2 ring-emerald-400/50 shadow-[inset_0_2px_0_rgba(255,255,255,1),inset_0_-3px_0_rgba(16,185,129,0.18),0_12px_20px_-8px_rgba(16,185,129,0.6)]",
    badge:
      "from-emerald-400 to-emerald-600 shadow-[0_4px_8px_-2px_rgba(5,150,105,0.8)]",
  },
  no: {
    icon: CircleX,
    tone: "red",
    title: "No",
    subtitle: "They did not submit on time",
    selected:
      "border-red-300 bg-white/85 ring-2 ring-red-400/50 shadow-[inset_0_2px_0_rgba(255,255,255,1),inset_0_-3px_0_rgba(239,68,68,0.18),0_12px_20px_-8px_rgba(239,68,68,0.6)]",
    badge:
      "from-red-400 to-red-600 shadow-[0_4px_8px_-2px_rgba(220,38,38,0.8)]",
  },
};

function AnswerBox({
  value,
  selected,
  disabled,
  onSelect,
}: {
  value: Choice;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const option = OPTION[value];

  return (
    <label className="relative block cursor-pointer has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
      <input
        type="radio"
        name="partner-submitted-on-time"
        value={value}
        checked={selected}
        onChange={onSelect}
        disabled={disabled}
        required
        className="peer sr-only"
      />

      <span
        className={`flex h-full flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition duration-150 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-400/40 motion-reduce:transition-none ${
          selected
            ? option.selected
            : "border-white/70 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_12px_-8px_rgba(60,70,160,0.35)] hover:-translate-y-0.5 hover:bg-white/60"
        }`}
      >
        {/* The icon stays dim until its box is chosen */}
        <span
          className={`transition duration-150 motion-reduce:transition-none ${
            selected ? "" : "opacity-70 saturate-50"
          }`}
        >
          <Icon3D icon={option.icon} tone={option.tone} size="md" />
        </span>

        <span className="text-base font-semibold text-neutral-900">
          {option.title}
        </span>
        <span className="text-xs leading-snug text-neutral-600">
          {option.subtitle}
        </span>

        {selected && (
          <span
            aria-hidden
            className={`absolute right-2 top-2 grid size-5 place-items-center rounded-full border-2 border-white bg-gradient-to-b text-white ${option.badge}`}
          >
            <Check className="size-3" strokeWidth={3.5} />
          </span>
        )}
      </span>
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* Form                                                                       */
/* -------------------------------------------------------------------------- */

export default function SubmitReportForm({
  onSubmit,
  onCancel,
  submitting = false,
  maxLength = 500,
}: SubmitReportFormProps) {
  const [comment, setComment] = useState("");
  const [choice, setChoice] = useState<Choice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loading = submitting || busy;
  const canSubmit = !loading && choice !== null;

  const handleSubmit = async () => {
    if (loading) return;

    // A report always needs an answer, never a default.
    if (choice === null) {
      setError("Choose Yes or No before you submit.");
      return;
    }

    setError(null);
    setBusy(true);

    try {
      await onSubmit({
        comment: comment.trim(),
        submittedOnTime: choice === "yes",
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We couldn't record your report. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative w-full space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight text-neutral-950">
            Report your partner
          </h3>
          <p className="text-sm leading-relaxed text-neutral-600">
            Review your partner&apos;s submission, then tell us whether they
            submitted on time. A comment is optional.
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close report form"
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-neutral-600 transition hover:bg-white/70 disabled:opacity-50 ${GLASS_INNER}`}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className={`rounded-2xl p-5 sm:p-6 ${GLASS}`}>
        <div className="flex items-start gap-3">
          <Icon3D icon={MessageSquareText} tone="blue" size="md" />

          <div>
            <h4 className="text-sm font-semibold text-neutral-950">
              Partner accountability
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">
              Check your partner&apos;s submission before you answer. Keep any
              explanation factual and respectful.
            </p>
          </div>
        </div>

        {/* The required answer: two boxes, one must be picked */}
        <fieldset className="mt-5">
          <legend className="mb-3 text-sm font-medium text-neutral-900">
            Did your partner submit their task on time?
            <span aria-hidden className="ml-1 text-red-600">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </legend>

          <div className="grid grid-cols-2 gap-3">
            <AnswerBox
              value="yes"
              selected={choice === "yes"}
              disabled={loading}
              onSelect={() => {
                setChoice("yes");
                setError(null);
              }}
            />
            <AnswerBox
              value="no"
              selected={choice === "no"}
              disabled={loading}
              onSelect={() => {
                setChoice("no");
                setError(null);
              }}
            />
          </div>

          {/* Says back what will be reported, so a mis-tap is easy to spot */}
          <p
            aria-live="polite"
            className={`mt-3 text-xs leading-relaxed ${
              choice === null ? "text-amber-700" : "text-neutral-600"
            }`}
          >
            {choice === null
              ? "Choose Yes or No to continue."
              : choice === "yes"
                ? "You're reporting that your partner submitted on time."
                : "You're reporting that your partner did not submit on time."}
          </p>
        </fieldset>

        <div className="mt-5">
          <label
            htmlFor="partner-report-comment"
            className="mb-2 block text-sm font-medium text-neutral-900"
          >
            Additional details
            <span className="ml-1.5 font-normal text-neutral-500">
              Optional
            </span>
          </label>

          <textarea
            id="partner-report-comment"
            value={comment}
            onChange={(event) =>
              setComment(event.target.value.slice(0, maxLength))
            }
            disabled={loading}
            rows={4}
            placeholder="Add context to help explain your report..."
            className="block min-h-24 w-full resize-y rounded-xl border border-white/70 bg-white/40 px-3.5 py-3 text-sm leading-relaxed text-neutral-900 outline-none transition placeholder:text-neutral-500 focus:border-blue-400 focus:bg-white/70 focus:ring-4 focus:ring-blue-400/20 disabled:opacity-60"
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-neutral-500">
              You can submit without a comment.
            </p>
            <span className="shrink-0 text-xs tabular-nums text-neutral-500">
              {comment.length}/{maxLength}
            </span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl bg-red-500 px-3.5 py-3 text-sm text-white"
          >
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {onCancel ? (
          <GeneralButton
            buttonFunction={onCancel}
            disabled={loading}
            variant="danger"
          >
            Cancel
          </GeneralButton>
        ) : (
          <p className="text-xs leading-relaxed text-neutral-500">
            Reports close at 9:30 PM.
          </p>
        )}

        <GeneralButton
          text={loading ? "Submitting report..." : "Submit Report"}
          buttonFunction={() => void handleSubmit()}
          variant={canSubmit ? "active" : "disabled"}
        />
      </div>
    </div>
  );
}
