"use client";

import { CalendarDays, FileText, Images, Send } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ResultRoomSubmissionHistoryItem } from "@/lib/queries/result-room";

// Adjust this path to wherever you keep icon-3d.tsx.
import { Icon3D } from "../fines/icon-3d";
import ImageSlider from "./image-slider";
import {
  GLASS_INNER,
  OUTLINE_BUTTON,
  formatDateTime,
  formatLongDay,
  formatShortDay,
  formatTime,
  plural,
  statusVisual,
} from "./submission-utils";

interface SubmissionDetailsDialogProps {
  submission: ResultRoomSubmissionHistoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SubmissionDetailsDialog({
  submission,
  open,
  onOpenChange,
}: SubmissionDetailsDialogProps) {
  if (!submission) return null;

  const status = statusVisual(submission.status);
  const description = submission.description?.trim();
  const files = submission.files;

  const rows = [
    {
      icon: CalendarDays,
      tone: "violet" as const,
      label: "Work done on",
      value: formatShortDay(submission.submission_date),
    },
    {
      icon: Send,
      tone: "blue" as const,
      label: "Submitted",
      value: formatDateTime(submission.submitted_at),
    },
    {
      icon: Images,
      tone: "amber" as const,
      label: "Evidence",
      value: files.length > 0 ? plural(files.length, "image") : "No images",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] gap-0 overflow-y-auto rounded-2xl border border-white/60 bg-white/55 p-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_24px_60px_-12px_rgba(40,50,140,0.35)] backdrop-blur-2xl sm:max-w-lg">
        <div className="space-y-4 p-4 sm:p-5">
          {/* Header */}
          <DialogHeader className="space-y-0 pr-8 text-left">
            <div className="flex items-start gap-3">
              <Icon3D icon={status.icon} tone={status.tone} size="lg" />

              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold leading-snug tracking-tight text-secondary-blue sm:text-sm">
                  {formatLongDay(submission.submission_date)}
                </DialogTitle>
                <DialogDescription className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                  <span
                    className={`inline-flex items-center gap-1.5 font-medium ${status.text}`}
                  >
                    <span
                      aria-hidden
                      className={`size-2 rounded-full ${status.dot}`}
                    />
                    {status.label}
                  </span>
                  <span>
                    Submitted at {formatTime(submission.submitted_at)}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Evidence */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-neutral-900">
              Your evidence
            </h3>

            {files.length > 0 ? (
              // Remount per submission so the slider always starts on image 1.
              <ImageSlider key={submission.id} files={files} />
            ) : (
              <p
                className={`rounded-2xl px-4 py-3.5 text-sm text-neutral-600 ${GLASS_INNER}`}
              >
                No images were attached to this submission.
              </p>
            )}
          </div>

          {/* What was worked on */}
          <div
            className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 ${GLASS_INNER}`}
          >
            <Icon3D icon={FileText} tone="blue" size="sm" />
            <div className="min-w-0 pt-0.5">
              <p className="text-xs text-neutral-500">What you worked on</p>
              {description ? (
                <p className="mt-0.5 whitespace-pre-line break-words text-sm leading-relaxed text-neutral-900">
                  {description}
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-neutral-500">
                  No description was added.
                </p>
              )}
            </div>
          </div>

          {/* Details */}
          <dl
            className={`divide-y divide-white/60 rounded-2xl px-4 ${GLASS_INNER}`}
          >
            {rows.map((row) => (
              <div key={row.label} className="flex items-center gap-3 py-3">
                <Icon3D icon={row.icon} tone={row.tone} size="sm" />
                <dt className="text-sm text-neutral-500">{row.label}</dt>
                <dd className="ml-auto text-right text-sm font-medium text-neutral-900">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <DialogFooter className="border-t border-white/60 p-4 sm:p-5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={`${OUTLINE_BUTTON} w-full sm:w-auto`}
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
