"use client";

import { useState } from "react";
import { MessageSquareText, X, CheckCircle2 } from "lucide-react";

import GeneralButton from "@/components/miscelleneous/generalButton";

interface SubmitReportFormProps {
  onSubmit: (payload: {
    comment: string;
    submittedOnTime: boolean;
  }) => void | Promise<void>;
  onCancel?: () => void;
  submitting?: boolean;
  maxLength?: number;
}

const GLASS =
  "border border-white/60 bg-white/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_-8px_rgba(60,70,160,0.25)]";

const GLASS_INNER = "border border-white/70 bg-white/30 backdrop-blur-md";

export default function SubmitReportForm({
  onSubmit,
  onCancel,
  submitting = false,
  maxLength = 500,
}: SubmitReportFormProps) {
  const [comment, setComment] = useState("");
  const [submittedOnTime, setSubmittedOnTime] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loading = submitting || busy;

  const handleSubmit = async () => {
    if (loading) return;

    if (submittedOnTime === null) {
      setError("Please confirm whether your partner submitted on time.");
      return;
    }

    setError(null);
    setBusy(true);

    try {
      await onSubmit({
        comment: comment.trim(),
        submittedOnTime,
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
            Review your partner's submission before deciding how to report their
            progress. A comment is optional.
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
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-blue-600 shadow-sm">
            <MessageSquareText className="size-5" />
          </span>

          <div>
            <h4 className="text-sm font-semibold text-neutral-950">
              Partner accountability
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">
              Check your partner's submission before completing this report.
              Keep any explanation factual and respectful.
            </p>
          </div>
        </div>

        {/* Submission status checkbox */}
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-white/70 bg-white/50 p-4 transition hover:bg-white/70 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
          <input
            type="checkbox"
            checked={submittedOnTime === true}
            onChange={(event) => setSubmittedOnTime(event.target.checked)}
            disabled={loading}
            required
            className="mt-0.5 size-4 shrink-0 accent-blue-600"
          />

          <span className="min-w-0">
            <span className="block text-sm font-medium text-neutral-900">
              My partner submitted their task on time
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-neutral-600">
              Check this box if your partner submitted before the daily
              submission deadline. Leave it unchecked if they did not.
            </span>
          </span>
        </label>

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
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 rounded-xl border border-neutral-200 px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancel
          </button>
        ) : (
          <p className="text-xs leading-relaxed text-neutral-500">
            Reports close at 9:30 PM.
          </p>
        )}

        <GeneralButton
          text={loading ? "Submitting report..." : "Submit Report"}
          buttonFunction={() => void handleSubmit()}
          variant={loading ? "disabled" : "active"}
        />
      </div>
    </div>
  );
}
