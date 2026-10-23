"use client";

import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  BadgeCheck,
  ClipboardCheck,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  Save,
  SquarePen,
} from "lucide-react";

import GeneralButton from "@/components/miscelleneous/generalButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
// Adjust this path to wherever you keep icon-3d.tsx.
import { Icon3D } from "@/components/result-room/dashboard/fines/icon-3d";
import {
  useResultRoomTodayPartnerReport,
  useUpdatePartnerReport,
} from "@/lib/queries/result-room";

import AnswerBoxes, { type Choice } from "./AnswerBoxes";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface UpdatePartnerReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxLength?: number;
}

type View = "form" | "saving" | "success" | "error";

/** retry: try again makes sense. final: it can't work (deadline, not found...). */
type ErrorKind = "retry" | "final";

interface Summary {
  choice: Choice;
  answerChanged: boolean;
  commentChanged: boolean;
}

/* -------------------------------------------------------------------------- */
/* Styles and helpers                                                         */
/* -------------------------------------------------------------------------- */

const GLASS_INNER = "border border-white/70 bg-white/30 backdrop-blur-md";

const SHADOW_UP =
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_-24px_60px_-12px_rgba(40,50,140,0.35)]";
const SHADOW_DOWN =
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_24px_60px_-12px_rgba(40,50,140,0.35)]";

const OUTLINE_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white/70 px-5 py-2.5 text-xs font-bold text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 md:text-sm";

const SCREEN =
  "flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto overscroll-contain px-6 py-8 text-center";

const choiceOf = (onTime: boolean): Choice => (onTime ? "yes" : "no");

function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);

  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

/** Large screens get a dialog; everything smaller gets a bottom sheet. */
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

function classifyError(error: unknown): { message: string; kind: ErrorKind } {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "We couldn't update your report. Please try again.";

  // The deadline has passed, or the report can't be edited at all.
  const kind: ErrorKind =
    /deadline|not found|cannot be edited|unauthorized|active room/i.test(
      message,
    )
      ? "final"
      : "retry";

  return { message, kind };
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function UpdatePartnerReportModal({
  isOpen,
  onClose,
  maxLength = 500,
}: UpdatePartnerReportModalProps) {
  const desktop = useIsDesktop();

  // Today's report, to fill the form. Only fetches while open.
  const query = useResultRoomTodayPartnerReport(isOpen);
  const mutation = useUpdatePartnerReport();

  const report = query.data?.report ?? null;

  const [view, setView] = useState<View>("form");
  const [choice, setChoice] = useState<Choice | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<{
    message: string;
    kind: ErrorKind;
  } | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  const initializedFor = useRef<string | null>(null);
  const savingRef = useRef(false);

  const busy = view === "saving" || mutation.isPending;

  /* Fill the form from the saved report, once per open. Clear it on close. */
  useEffect(() => {
    if (!isOpen) {
      initializedFor.current = null;
      savingRef.current = false;
      setView("form");
      setChoice(null);
      setComment("");
      setError(null);
      setSummary(null);
      return;
    }

    if (report && initializedFor.current !== report.id) {
      initializedFor.current = report.id;
      setChoice(choiceOf(report.submitted_on_time));
      setComment(report.comment ?? "");
    }
  }, [isOpen, report]);

  /* What changed compared with what is saved */
  const savedChoice = report ? choiceOf(report.submitted_on_time) : null;
  const savedComment = (report?.comment ?? "").trim();

  const answerChanged = choice !== null && choice !== savedChoice;
  const commentChanged = comment.trim() !== savedComment;
  const dirty = answerChanged || commentChanged;
  const canSave = !!report && choice !== null && dirty && !busy;

  const hint =
    choice === null
      ? "Choose Yes or No."
      : !dirty
        ? "Change your answer or comment to save."
        : "Ready to save your changes.";

  /* ------------------------------------------------------------------------ */
  /* Actions                                                                  */
  /* ------------------------------------------------------------------------ */

  const handleOpenChange = (open: boolean) => {
    // Don't let a stray tap close it halfway through saving.
    if (!open && busy) return;
    if (!open) onClose();
  };

  const handleSave = async () => {
    if (!report || choice === null || savingRef.current) return;

    savingRef.current = true;
    setError(null);
    setView("saving");

    try {
      await mutation.mutateAsync({
        reportId: report.id,
        date: report.review_date,
        comment: comment.trim(),
        submittedOnTime: choice === "yes",
      });

      setSummary({ choice, answerChanged, commentChanged });
      setView("success");
    } catch (saveError) {
      setError(classifyError(saveError));
      setView("error");
    } finally {
      savingRef.current = false;
    }
  };

  /* ------------------------------------------------------------------------ */
  /* The screens inside the dialog / sheet                                    */
  /* ------------------------------------------------------------------------ */

  /**
   * Title and Description come from whichever container is showing (the
   * dialog's or the sheet's), because each one needs its own.
   */
  const renderContent = (
    Title: ElementType,
    Description: ElementType,
    heightClass: string,
  ): ReactNode => {
    let inner: ReactNode;

    if (view === "saving") {
      inner = (
        <>
          <Title className="sr-only">Saving your changes</Title>
          <Description className="sr-only">
            Updating your partner report.
          </Description>

          <div role="status" aria-live="polite" className={SCREEN}>
            <Icon3D icon={Loader2} tone="blue" size="xl" spin />
            <h3 className="mt-5 text-lg font-semibold tracking-tight text-secondary-blue">
              Saving your changes
            </h3>
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-neutral-600">
              Updating your report. Please keep this page open.
            </p>
          </div>
        </>
      );
    } else if (view === "success" && summary) {
      inner = (
        <>
          <Title className="sr-only">Report updated</Title>
          <Description className="sr-only">
            Your partner report was updated.
          </Description>

          <div role="status" aria-live="polite" className={SCREEN}>
            <div className="animate-in zoom-in-50 duration-300 motion-reduce:animate-none">
              <Icon3D icon={BadgeCheck} tone="emerald" size="xl" />
            </div>

            <h3 className="mt-5 text-lg font-semibold tracking-tight text-secondary-blue">
              Report updated
            </h3>
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-neutral-600">
              Your changes are saved.
            </p>

            <dl
              className={`mt-5 w-full max-w-sm divide-y divide-white/60 rounded-2xl px-4 text-left ${GLASS_INNER}`}
            >
              <div className="flex items-center gap-3 py-3">
                <Icon3D
                  icon={ClipboardCheck}
                  tone={summary.choice === "yes" ? "emerald" : "red"}
                  size="sm"
                />
                <dt className="text-sm text-neutral-600">Your answer</dt>
                <dd className="ml-auto text-sm font-semibold text-neutral-900">
                  {summary.choice === "yes" ? "On time" : "Not on time"}
                  {summary.answerChanged && (
                    <span className="ml-1.5 text-xs font-medium text-blue-700">
                      updated
                    </span>
                  )}
                </dd>
              </div>

              <div className="flex items-center gap-3 py-3">
                <Icon3D icon={MessageSquare} tone="blue" size="sm" />
                <dt className="text-sm text-neutral-600">Comment</dt>
                <dd className="ml-auto text-sm font-semibold text-neutral-900">
                  {summary.commentChanged ? "Updated" : "Unchanged"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex w-full justify-center">
              <GeneralButton
                text="Done"
                variant="active"
                className="w-full sm:w-auto"
                buttonFunction={onClose}
              />
            </div>
          </div>
        </>
      );
    } else if (view === "error" && error) {
      inner = (
        <>
          <Title className="sr-only">Report not updated</Title>
          <Description className="sr-only">{error.message}</Description>

          <div role="alert" className={SCREEN}>
            <Icon3D icon={AlertCircle} tone="red" size="xl" />

            <h3 className="mt-5 text-lg font-semibold tracking-tight text-secondary-blue">
              {error.kind === "final"
                ? "This can't be updated"
                : "We couldn't update your report"}
            </h3>

            <p
              className={`mt-3 max-w-sm rounded-2xl px-4 py-3 text-left text-sm leading-relaxed text-neutral-700 ${GLASS_INNER}`}
            >
              {error.message}
            </p>

            <div className="mt-6 flex w-full flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center">
              {error.kind === "retry" ? (
                <>
                  <GeneralButton
                    variant="active"
                    className="w-full sm:w-auto"
                    buttonFunction={() => void handleSave()}
                  >
                    <RefreshCw />
                    Try again
                  </GeneralButton>

                  <button
                    type="button"
                    onClick={() => setView("form")}
                    className={`${OUTLINE_BUTTON} w-full sm:w-auto`}
                  >
                    Back to editing
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className={`${OUTLINE_BUTTON} w-full sm:w-auto`}
                  >
                    Close
                  </button>
                </>
              ) : (
                <GeneralButton
                  text="Close"
                  variant="active"
                  className="w-full sm:w-auto"
                  buttonFunction={onClose}
                />
              )}
            </div>
          </div>
        </>
      );
    } else {
      inner = (
        <>
          {/* Header */}
          <div className="shrink-0 border-b border-white/60 p-4 pr-12 text-left sm:p-5 sm:pr-12">
            <div className="flex items-start gap-3">
              <Icon3D icon={SquarePen} tone="blue" size="lg" />

              <div className="min-w-0">
                <Title className="text-base font-semibold leading-snug tracking-tight text-secondary-blue">
                  Update your report
                </Title>
                <Description className="mt-0.5 text-xs leading-relaxed text-gray-500">
                  {report
                    ? `Your report for ${formatDate(report.review_date)}. You can change it until the window closes.`
                    : "Change your answer or comment on today's report."}
                </Description>
              </div>
            </div>
          </div>

          {/* Body: this is the part that scrolls */}
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-5">
            {query.isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <Icon3D icon={Loader2} tone="blue" size="lg" spin />
                <p className="text-sm font-medium text-neutral-700">
                  Loading your report...
                </p>
              </div>
            ) : query.isError ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Icon3D icon={AlertCircle} tone="red" size="lg" />
                <h3 className="mt-4 font-semibold text-neutral-950">
                  Could not load your report
                </h3>
                <p className="mt-1.5 max-w-sm text-sm text-neutral-600">
                  {query.error instanceof Error
                    ? query.error.message
                    : "Something went wrong while loading this report."}
                </p>
                <div className="mt-4">
                  <GeneralButton
                    text="Try again"
                    variant="active"
                    buttonFunction={() => void query.refetch()}
                  />
                </div>
              </div>
            ) : !report ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Icon3D icon={FileText} tone="slate" size="lg" />
                <h3 className="mt-4 font-semibold text-neutral-950">
                  No report to update
                </h3>
                <p className="mt-1.5 max-w-sm text-sm leading-6 text-neutral-600">
                  We couldn&apos;t find a partner report from you for today.
                </p>
              </div>
            ) : (
              <>
                <AnswerBoxes value={choice} onChange={setChoice} />

                <div>
                  <label
                    htmlFor="update-report-comment"
                    className="mb-2 block text-sm font-medium text-neutral-900"
                  >
                    Additional details
                    <span className="ml-1.5 font-normal text-neutral-500">
                      Optional
                    </span>
                  </label>

                  <textarea
                    id="update-report-comment"
                    value={comment}
                    onChange={(event) =>
                      setComment(event.target.value.slice(0, maxLength))
                    }
                    rows={4}
                    placeholder="Add context to help explain your report..."
                    className="block min-h-24 w-full resize-y rounded-xl border border-white/70 bg-white/40 px-3.5 py-3 text-sm leading-relaxed text-neutral-900 outline-none transition placeholder:text-neutral-500 focus:border-blue-400 focus:bg-white/70 focus:ring-4 focus:ring-blue-400/20"
                  />

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-xs text-neutral-500">
                      Clear it to remove your comment.
                    </p>
                    <span className="shrink-0 text-xs tabular-nums text-neutral-500">
                      {comment.length}/{maxLength}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer: always in view, even when the body scrolls */}
          {report && (
            <div className="shrink-0 space-y-2.5 border-t border-white/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
              <p
                className={`text-xs ${
                  choice === null ? "text-amber-700" : "text-neutral-500"
                }`}
              >
                {hint}
              </p>

              <div className="flex gap-2.5 sm:justify-end">
                <GeneralButton variant="danger" buttonFunction={onClose}>
                  Cancel
                </GeneralButton>

                <GeneralButton
                  variant={canSave ? "active" : "disabled"}
                  className="flex-1 sm:flex-none"
                  buttonFunction={() => void handleSave()}
                >
                  <Save />
                  Save changes
                </GeneralButton>
              </div>
            </div>
          )}
        </>
      );
    }

    return <div className={`flex flex-col ${heightClass}`}>{inner}</div>;
  };

  /* ------------------------------------------------------------------------ */
  /* Dialog on large screens, bottom sheet on smaller ones                    */
  /* ------------------------------------------------------------------------ */

  if (desktop) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className={`gap-0 overflow-hidden rounded-3xl border border-white/60 bg-white/55 p-0 backdrop-blur-2xl ${SHADOW_DOWN} sm:max-w-lg`}
        >
          {renderContent(DialogTitle, DialogDescription, "max-h-[85dvh]")}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className={`gap-0 overflow-hidden rounded-t-3xl border-white/60 bg-white/60 p-0 backdrop-blur-2xl ${SHADOW_UP}`}
      >
        {/* Up to half of the screen's height, and the body scrolls inside it */}
        {renderContent(SheetTitle, SheetDescription, "max-h-[50dvh]")}
      </SheetContent>
    </Sheet>
  );
}
