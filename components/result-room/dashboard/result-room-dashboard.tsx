"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Pencil, Plus, Info } from "lucide-react";
import goGetter from "@/app/assets/images/goGetter.jpg";

import {
  useResultRoomDashboard,
  useCreateResultRoomSubmission,
  useCreatePartnerReport,
} from "@/lib/queries/result-room";

import type { SubmissionPayload } from "./submission/SubmissionForm";

import {
  getParticipantTimezone,
  getDailySubmissionDeadline,
  getPartnerReportDeadline,
} from "@/lib/result-room/deadlines";

import { ResultRoomHeatmap } from "./Streak";

import GeneralButton from "@/components/miscelleneous/generalButton";
import SecondaryButton from "@/components/miscelleneous/secondaryButton";
import MobileNav from "./MobileNavbar";
import SubmissionForm from "./submission/SubmissionForm";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import SubmissionUploading from "./submission/submissionUploading";
import SubmissionSuccess from "./submission/submissionSuccess";
import SubmissionError from "./submission/submissionError";

import SubmitReportForm from "./reports/submitReportForm";
import SubmitReportUploading from "./reports/submitReportUploading";
import SubmitReportSuccess from "./reports/submitReportSuccess";
import SubmitReportError from "./reports/submitReportError";

import SubmissionViewModal from "./modals/SubmissionViewModal";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Participant = {
  id: string;
  room_status: "pending" | "active" | "locked" | "evicted";
  isAdmin: boolean;
  adminRole: string | null;
  statusReason: string | null;
  statusChangedAt: string | null;
};

type ParticipantResponse = {
  success: boolean;
  participant: Participant | null;
  error?: string;
};

type SubmissionView = "form" | "uploading" | "saving" | "success" | "error";

type SubmissionErrorDetails = {
  message: string;
  imageCount: number;
};

type UploadProgressState = {
  progress: number;
  imageCount: number;
};

type ReportView = "form" | "submitting" | "success" | "error";

type ReportErrorDetails = {
  message: string;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(Math.floor(milliseconds / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${seconds}s`;
}

/**
 * Returns today's date in the participant's timezone as YYYY-MM-DD.
 *
 * The API must still validate the date and enforce its own deadline.
 */
function getTodayInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to determine today's date.");
  }

  return `${year}-${month}-${day}`;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

const ResultRoomDashboard = () => {
  const { data: dashboardData } = useResultRoomDashboard();

  const submissionMutation = useCreateResultRoomSubmission();
  const partnerReportMutation = useCreatePartnerReport();

  /* ------------------------------------------------------------------------ */
  /* Daily submission state                                                   */
  /* ------------------------------------------------------------------------ */

  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [submissionView, setSubmissionView] = useState<SubmissionView>("form");

  const [submissionError, setSubmissionError] =
    useState<SubmissionErrorDetails | null>(null);

  const [lastSubmissionPayload, setLastSubmissionPayload] =
    useState<SubmissionPayload | null>(null);

  const [submissionUploadProgress, setSubmissionUploadProgress] =
    useState<UploadProgressState>({
      progress: 0,
      imageCount: 0,
    });

  /* ------------------------------------------------------------------------ */
  /* Partner report state                                                     */
  /* ------------------------------------------------------------------------ */

  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportView, setReportView] = useState<ReportView>("form");

  const [reportError, setReportError] = useState<ReportErrorDetails | null>(
    null,
  );

  const [reportComment, setReportComment] = useState("");
  const [reportSubmittedOnTime, setReportSubmittedOnTime] = useState<
    boolean | null
  >(null);

  const [reportSubmitting, setReportSubmitting] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* Partner submission modal state                                           */
  /* ------------------------------------------------------------------------ */

  const [partnerSubmissionDialogOpen, setPartnerSubmissionDialogOpen] =
    useState(false);
  /* ------------------------------------------------------------------------ */
  /* Participant submission modal state                                           */
  /* ------------------------------------------------------------------------ */

  const [participantSubmissionDialogOpen, setParticipantSubmissionDialogOpen] =
    useState(false);

  /* ------------------------------------------------------------------------ */
  /* Participant state                                                        */
  /* ------------------------------------------------------------------------ */

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /* Time                                                                      */
  /* ------------------------------------------------------------------------ */

  const [timezone, setTimezone] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setTimezone(getParticipantTimezone());
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const submissionDeadline = timezone
    ? getDailySubmissionDeadline(timezone, now)
    : null;

  const partnerReportDeadline = timezone
    ? getPartnerReportDeadline(timezone, now)
    : null;

  const today = timezone
    ? getTodayInTimezone(timezone)
    : getTodayInTimezone(getParticipantTimezone());

  /* ------------------------------------------------------------------------ */
  /* Load participant                                                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    async function loadParticipant() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/result/participant", {
          cache: "no-store",
        });

        const data = (await response.json()) as ParticipantResponse;

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load Result Room participant.",
          );
        }

        if (!data.participant) {
          throw new Error(
            "You are not registered as a Result Room participant.",
          );
        }

        setParticipant(data.participant);
      } catch (error) {
        console.error("Error loading Result Room participant:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong while loading Result Room.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadParticipant();
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Daily submission progress                                                */
  /* ------------------------------------------------------------------------ */

  const handleUploadProgressChange = ({
    uploading,
    progress,
    imageCount,
  }: {
    uploading: boolean;
    progress: number;
    imageCount: number;
  }) => {
    setSubmissionUploadProgress({ progress, imageCount });

    if (uploading) {
      setSubmissionView("uploading");
      return;
    }

    setSubmissionView((current) =>
      current === "uploading" ? "form" : current,
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Save daily submission                                                    */
  /* ------------------------------------------------------------------------ */

  const handleSubmission = async (payload: SubmissionPayload) => {
    setLastSubmissionPayload(payload);
    setSubmissionError(null);
    setSubmissionView("saving");

    try {
      await submissionMutation.mutateAsync({
        timezone: timezone ?? getParticipantTimezone(),
        description: payload.description,
        files: payload.files,
      });

      setSubmissionView("success");
    } catch (error) {
      console.error("Failed to save Result Room submission:", error);

      setSubmissionError({
        message:
          error instanceof Error
            ? error.message
            : "We couldn't confirm that your submission was saved. Please try again.",
        imageCount: payload.files.length,
      });

      setSubmissionView("error");
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Retry daily submission                                                   */
  /* ------------------------------------------------------------------------ */

  const handleRetrySubmission = async () => {
    if (!lastSubmissionPayload || submissionMutation.isPending) {
      return;
    }

    await handleSubmission(lastSubmissionPayload);
  };

  /* ------------------------------------------------------------------------ */
  /* Daily submission dialog                                                  */
  /* ------------------------------------------------------------------------ */

  const resetSubmissionState = () => {
    setSubmissionView("form");
    setSubmissionError(null);
    setLastSubmissionPayload(null);

    setSubmissionUploadProgress({
      progress: 0,
      imageCount: 0,
    });
  };

  const handleSubmissionDialogOpenChange = (open: boolean) => {
    if (
      !open &&
      (submissionView === "uploading" ||
        submissionView === "saving" ||
        submissionMutation.isPending)
    ) {
      return;
    }

    setSubmissionDialogOpen(open);

    if (!open) {
      resetSubmissionState();
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Submit partner report                                                    */
  /* ------------------------------------------------------------------------ */

  const handleSubmitReport = async (
    comment: string,
    submittedOnTime: boolean,
  ) => {
    if (reportSubmitting) {
      return;
    }

    setReportSubmitting(true);
    setReportError(null);
    setReportView("submitting");

    try {
      await partnerReportMutation.mutateAsync({
        date: today,
        comment: comment.trim(),
        submittedOnTime,
      });

      setReportComment(comment);
      setReportSubmittedOnTime(submittedOnTime);
      setReportView("success");
    } catch (error) {
      console.error("Failed to submit partner report:", error);

      setReportError({
        message:
          error instanceof Error
            ? error.message
            : "We couldn't submit your report. Please try again.",
      });

      setReportView("error");
    } finally {
      setReportSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Partner report dialog                                                    */
  /* ------------------------------------------------------------------------ */

  const resetReportState = () => {
    setReportView("form");
    setReportError(null);
    setReportComment("");
    setReportSubmittedOnTime(null);
  };

  const handleReportDialogOpenChange = (open: boolean) => {
    if (!open && reportSubmitting) {
      return;
    }

    setReportDialogOpen(open);

    if (!open) {
      resetReportState();
    }
  };

  const handleRetryReport = async () => {
    if (reportSubmitting || reportSubmittedOnTime === null) {
      return;
    }

    await handleSubmitReport(reportComment, reportSubmittedOnTime);
  };

  /* ------------------------------------------------------------------------ */
  /* Loading state                                                            */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="flex min-h-screen items-center justify-center">
          <p>Loading Result Room...</p>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Error state                                                              */
  /* ------------------------------------------------------------------------ */

  if (error) {
    return (
      <main className="min-h-screen">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-semibold">
              Unable to load Result Room
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!participant) {
    return null;
  }

  /* ------------------------------------------------------------------------ */
  /* Non-active participant                                                   */
  /* ------------------------------------------------------------------------ */

  if (participant.room_status !== "active") {
    return (
      <main className="min-h-screen">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-semibold">
              Result Room access unavailable
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Your current Result Room status is{" "}
              <span className="font-medium">{participant.room_status}</span>.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return <p>Loading!!!</p>;
  }

  /* ------------------------------------------------------------------------ */
  /* Dashboard                                                                */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      <main className="min-h-screen w-full">
        <div className="h-full w-full p-2 md:col-span-1 lg:col-span-2">
          {dashboardData.room !== null ? (
            <>
              <ResultRoomHeatmap
                startDate={dashboardData.room.startDate}
                endDate={dashboardData.room.endDate}
                submissionDates={dashboardData.submissionActivity.dates}
              />
              <div className="mx-auto my-4 w-full">
                {/* Today's check-in */}
                <section className="mt-4">
                  <h1 className="mb-2 text-sm">Today&apos;s Check-in</h1>

                  {/* Task submission */}
                  <div className="min-h-12 w-full rounded-2xl border border-white px-6 py-3 shadow-md backdrop-blur-3xl">
                    <h1 className="text-sm">Task Submission</h1>

                    <div className="mt-1 w-full">
                      {dashboardData.today.submissionCompleted ? (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs md:text-sm">Well done 👍</p>
                          <GeneralButton
                            onClick={() =>
                              setParticipantSubmissionDialogOpen(true)
                            }
                            text="View Submission"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <Info className="size-4 text-primary-blue" />

                            <p className="text-xs md:text-sm">
                              {submissionDeadline?.isOpen
                                ? "Done with your task?"
                                : "Today's submission window is closed."}
                            </p>
                          </span>

                          {submissionDeadline?.isOpen ? (
                            <Dialog
                              open={submissionDialogOpen}
                              onOpenChange={handleSubmissionDialogOpenChange}
                            >
                              <DialogTrigger asChild>
                                <SecondaryButton>
                                  <span className="flex items-center gap-2 text-sm">
                                    <Plus className="size-4 md:size-6" />

                                    <span className="text-xs md:text-sm">
                                      Submit Task
                                    </span>
                                  </span>
                                </SecondaryButton>
                              </DialogTrigger>

                              <DialogContent className="isolate max-h-[95vh] overflow-x-hidden overflow-y-auto rounded-[28px] border border-white/70 bg-gradient-to-br from-yellow-200 via-blue-100 to-blue-200 p-4 sm:max-w-md sm:p-5">
                                <SubmissionForm
                                  onSubmit={handleSubmission}
                                  onUploadProgressChange={
                                    handleUploadProgressChange
                                  }
                                  submitting={submissionMutation.isPending}
                                  onCancel={() =>
                                    handleSubmissionDialogOpenChange(false)
                                  }
                                  className={
                                    submissionView === "form" ? "" : "hidden"
                                  }
                                />

                                {submissionView === "uploading" && (
                                  <SubmissionUploading
                                    progress={submissionUploadProgress.progress}
                                    imageCount={
                                      submissionUploadProgress.imageCount
                                    }
                                    message="Uploading your evidence..."
                                  />
                                )}

                                {submissionView === "saving" && (
                                  <SubmissionUploading
                                    imageCount={
                                      lastSubmissionPayload?.files.length ?? 0
                                    }
                                    message="Saving your submission..."
                                  />
                                )}

                                {submissionView === "success" && (
                                  <SubmissionSuccess
                                    imageCount={
                                      lastSubmissionPayload?.files.length ?? 0
                                    }
                                    description={
                                      lastSubmissionPayload?.description
                                    }
                                    onContinue={() =>
                                      handleSubmissionDialogOpenChange(false)
                                    }
                                  />
                                )}

                                {submissionView === "error" &&
                                  submissionError && (
                                    <SubmissionError
                                      message={submissionError.message}
                                      imageCount={submissionError.imageCount}
                                      retrying={submissionMutation.isPending}
                                      onRetry={handleRetrySubmission}
                                      onCancel={() =>
                                        handleSubmissionDialogOpenChange(false)
                                      }
                                    />
                                  )}
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <SecondaryButton disabled>
                              <span className="flex items-center gap-2 text-sm">
                                <Plus className="size-4 md:size-6" />

                                <span className="text-xs md:text-sm">
                                  Submission Closed
                                </span>
                              </span>
                            </SecondaryButton>
                          )}
                        </div>
                      )}

                      {!dashboardData.today.submissionCompleted &&
                        submissionDeadline && (
                          <p className="mt-2 text-right text-[11px] text-gray-500">
                            {submissionDeadline.isOpen
                              ? `Closes in ${formatCountdown(
                                  submissionDeadline.millisecondsRemaining,
                                )}`
                              : "Submissions closed at 9:00 PM"}
                          </p>
                        )}
                    </div>
                  </div>

                  {/* Partner check */}
                  <div className="mt-2 min-h-12 w-full rounded-2xl border border-white px-6 py-3 shadow-md backdrop-blur-3xl">
                    <h1 className="text-sm">Partner Check</h1>

                    <div className="mt-1 w-full">
                      {dashboardData.today.partnerReviewSubmitted ? (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs md:text-sm">
                            Partner check completed 👍
                          </p>

                          <GeneralButton text="View Report" />
                        </div>
                      ) : (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <Info className="size-4 text-primary-blue" />

                            <p className="text-xs md:text-sm">
                              {partnerReportDeadline?.isOpen
                                ? "Check on your partner?"
                                : "Partner reporting is closed."}
                            </p>
                          </span>

                          {partnerReportDeadline?.isOpen ? (
                            <Dialog
                              open={reportDialogOpen}
                              onOpenChange={handleReportDialogOpenChange}
                            >
                              <DialogTrigger asChild>
                                <SecondaryButton
                                  onClick={() => {
                                    setReportView("form");
                                    setReportError(null);
                                  }}
                                >
                                  <span className="flex items-center gap-2 text-sm">
                                    <Plus className="size-4 md:size-6" />

                                    <span className="text-xs md:text-sm">
                                      Submit Report
                                    </span>
                                  </span>
                                </SecondaryButton>
                              </DialogTrigger>

                              <DialogContent className="isolate max-h-[95vh] overflow-x-hidden overflow-y-auto rounded-[28px] border border-white/70 bg-gradient-to-br from-yellow-200 via-blue-100 to-blue-200 p-4 sm:max-w-md sm:p-5">
                                {reportView === "form" && (
                                  <SubmitReportForm
                                    onSubmit={({ comment, submittedOnTime }) =>
                                      handleSubmitReport(
                                        comment,
                                        submittedOnTime,
                                      )
                                    }
                                    submitting={reportSubmitting}
                                    onCancel={() =>
                                      handleReportDialogOpenChange(false)
                                    }
                                  />
                                )}

                                {reportView === "submitting" && (
                                  <SubmitReportUploading message="Submitting your partner report..." />
                                )}

                                {reportView === "success" && (
                                  <SubmitReportSuccess
                                    onContinue={() =>
                                      handleReportDialogOpenChange(false)
                                    }
                                  />
                                )}

                                {reportView === "error" && reportError && (
                                  <SubmitReportError
                                    message={reportError.message}
                                    retrying={reportSubmitting}
                                    onRetry={handleRetryReport}
                                    onCancel={() =>
                                      handleReportDialogOpenChange(false)
                                    }
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <SecondaryButton disabled>
                              <span className="flex items-center gap-2 text-sm">
                                <Plus className="size-4 md:size-6" />

                                <span className="text-xs md:text-sm">
                                  Report Closed
                                </span>
                              </span>
                            </SecondaryButton>
                          )}
                        </div>
                      )}

                      {!dashboardData.today.partnerReviewSubmitted &&
                        partnerReportDeadline && (
                          <p className="mt-2 text-right text-[11px] text-gray-500">
                            {partnerReportDeadline.isOpen
                              ? `Closes in ${formatCountdown(
                                  partnerReportDeadline.millisecondsRemaining,
                                )}`
                              : "Reports closed at 9:30 PM"}
                          </p>
                        )}
                    </div>
                  </div>

                  {/* Open the reusable partner submission modal */}
                  <div className="mt-3 flex justify-end">
                    <GeneralButton
                      onClick={() => setPartnerSubmissionDialogOpen(true)}
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <Info className="size-4" />
                        View Partner&apos;s Submission
                      </span>
                    </GeneralButton>
                  </div>
                </section>
              </div>
            </>
          ) : (
            <p>Loading!!!</p>
          )}

          <MobileNav />
        </div>

      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Reusable participant submission modal                                  */}
      {/* ------------------------------------------------------------------ */}
      <SubmissionViewModal
        isOpen={participantSubmissionDialogOpen}
        onClose={() => setParticipantSubmissionDialogOpen(false)}
        date={today}
        mode="own"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Reusable partner submission modal                                  */}
      {/* ------------------------------------------------------------------ */}

      <SubmissionViewModal
        isOpen={partnerSubmissionDialogOpen}
        onClose={() => setPartnerSubmissionDialogOpen(false)}
        date={today}
        mode="partner"
      />
    </>
  );
};

export default ResultRoomDashboard;
