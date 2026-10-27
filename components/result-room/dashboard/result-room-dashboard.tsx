"use client";

import { useEffect, useMemo, useState } from "react";
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
import SubmissionForm from "./submission/SubmissionForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import SubmissionUploading from "./submission/submissionUploading";
import SubmissionSuccess from "./submission/submissionSuccess";
import SubmissionError from "./submission/submissionError";
import SubmitReportForm from "./reports/submitReportForm";
import SubmitReportUploading from "./reports/submitReportUploading";
import SubmitReportSuccess from "./reports/submitReportSuccess";
import SubmitReportError from "./reports/submitReportError";

import SubmissionViewModal from "./modals/SubmissionViewModal";
import PartnerReportViewModal from "./modals/TodayReportModal";
import UpdateSubmissionModal from "@/components/result-room/dashboard/modals/UpdateSubmissionModal";
import UpdatePartnerReportModal from "@/components/result-room/dashboard/reports/update/UpdatePartnerReportModal";
import StreakCard from "./StreakCard";
import TimelinePair from "./TImelinePair";
import { useResultRoomStore } from "@/lib/stores/result-room-store";
import { UprixLoadingScreen } from "@/components/branding/UprixLoadingScreen";
import PartnerProfileCard from "./cards/PartnerProfileCard";
import {
  PartnerCheckCard,
  TaskSubmissionCard,
  type WindowState,
} from "./cards/CheckIn";
import { buildHeatmapData } from "@/lib/result-room/build-heatmap";
import { computeStats, flattenDays } from "./Streak";
import ProgressHeroCard from "./ProgressHeroCard";
import { formatDateWithOrdinal, getGreeting, getFirstName } from "@/lib/helper";
import LockedDashboard from "./LockedDashboard";
import QuoteDisplay from "./QuoteDisplay";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Participant = {
  id: string;
  room_status: "pending" | "active" | "locked" | "evicted";
  isAdmin: boolean;
  goal: string;
  name: string;
  adminRole: string | null;
  statusReason: string | null;
  statusChangedAt: string | null;
  eviction_stage: string | null;
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
 * Turns a deadline into what the cards need to know.
 *
 * null means the participant's timezone and clock aren't ready yet, so we
 * can't say whether the window is open. (Before, that moment looked like
 * "closed", which flashed a "Submission Closed" button on every page load.)
 */
function getWindowState(deadline: { isOpen: boolean } | null): WindowState {
  if (!deadline) return "loading";

  return deadline.isOpen ? "open" : "closed";
}

/**
 * Returns today's date in the participant's timezone as YYYY-MM-DD.
 *
 * The API must still validate the date and enforce its own deadline.
 */
function getTodayInTimezone(timezone: string, date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

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
  const {
    data: dashboardData,
    isPending,
    isError,
    error: dashboardError,
    status,
    fetchStatus,
  } = useResultRoomDashboard();

  const submissionMutation = useCreateResultRoomSubmission();
  const partnerReportMutation = useCreatePartnerReport();

  /**
   * Read only the calculated room progress from Zustand.
   */
  const roomProgress = useResultRoomStore((state) => state.roomProgress);

  /**
   * Safe fallback while the dashboard data is
   * still loading.
   */
  const currentDay = roomProgress?.currentDay ?? 0;

  const totalDays = roomProgress?.totalDays ?? 90;

  const streakStats = useMemo(() => {
    const room = dashboardData?.room;

    if (!room) {
      return { current: 0, submitted: 0 };
    }

    const weeks = buildHeatmapData({
      startDate: room.startDate,
      endDate: room.endDate,
      submissionDates: dashboardData.submissionActivity.dates,
    });

    const stats = computeStats(flattenDays(weeks));

    return {
      current: stats.current,
      submitted: stats.submitted,
    };
  }, [dashboardData]);

  /* ------------------------------------------------------------------------ */
  /* Daily submission state                                                   */
  /* ------------------------------------------------------------------------ */

  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [submissionView, setSubmissionView] = useState<SubmissionView>("form");

  /** The "view report" modal (your report on your partner). */
  const [partnerReportDialogOpen, setPartnerReportDialogOpen] =
    useState<boolean>(false);

  const [submissionError, setSubmissionError] =
    useState<SubmissionErrorDetails | null>(null);

  const [lastSubmissionPayload, setLastSubmissionPayload] =
    useState<SubmissionPayload | null>(null);

  const [submissionUploadProgress, setSubmissionUploadProgress] =
    useState<UploadProgressState>({
      progress: 0,
      imageCount: 0,
    });

  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isEditReportOpen, setIsEditReportOpen] = useState<boolean>(false);

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
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setTimezone(getParticipantTimezone());
    setNow(new Date());
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const submissionDeadline =
    timezone && now ? getDailySubmissionDeadline(timezone, now) : null;

  const partnerReportDeadline =
    timezone && now ? getPartnerReportDeadline(timezone, now) : null;

  const today = timezone && now ? getTodayInTimezone(timezone, now) : "";

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
  /* Opening the dialogs from the check-in cards                              */
  /* ------------------------------------------------------------------------ */

  const openSubmissionDialog = () => handleSubmissionDialogOpenChange(true);

  const openReportDialog = () => {
    setReportView("form");
    setReportError(null);
    setReportDialogOpen(true);
  };

  /**
   * TODO: editing.
   *
   * For now Edit opens the same form as Submit. The forms start empty and
   * save through the "create" mutations, so a real edit needs an update
   * endpoint and a form that is filled with what was sent before.
   */
  const handleEditReport = () => openReportDialog();

  /* ------------------------------------------------------------------------ */
  /* Loading state                                                            */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return <UprixLoadingScreen />;
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

  // /* ------------------------------------------------------------------------ */
  // /* Non-active participant                                                   */
  // /* ------------------------------------------------------------------------ */

  // if (participant.room_status !== "active") {
  //   return (
  //     <main className="min-h-screen">
  //       <div className="flex min-h-screen items-center justify-center">
  //         <div className="text-center">
  //           <h1 className="text-xl font-semibold">
  //             Result Room access unavailable
  //           </h1>

  //           <p className="mt-2 text-sm text-muted-foreground">
  //             Your current Result Room status is{" "}
  //             <span className="font-medium">{participant.room_status}</span>.
  //           </p>
  //         </div>
  //       </div>
  //     </main>
  //   );
  // }
  /* ------------------------------------------------------------------------ */
  /* For locked participant dashboard                                         */
  /* ------------------------------------------------------------------------ */

  // if (
  //   participant.room_status !== "active"
  //   //participant.eviction_stage === "LOCKED"
  // ) {
  //   return <LockedDashboard />;
  // }

  if (!dashboardData) {
    if (isError) {
      return (
        <p>
          Unable to load dashboard:{" "}
          {dashboardError instanceof Error
            ? dashboardError.message
            : "Unknown error"}
        </p>
      );
    }

    return <UprixLoadingScreen />;
  }

  /* ------------------------------------------------------------------------ */
  /* Dashboard                                                                */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      <main className="min-h-screen w-full">
        <div className="h-full w-full md:col-span-1 lg:col-span-2">
          {dashboardData.room !== null ? (
            <>
              <div className="my-2">
                <p className="text-sm text-gray-700">
                  {formatDateWithOrdinal()}
                </p>
                <h6 className="font-semibold text-lg capitalize mt-1">
                  {getGreeting()},{" "}
                  {getFirstName(
                    dashboardData.profile?.name ?? participant.name,
                  )}
                </h6>
              </div>
              <ProgressHeroCard
                currentDay={currentDay}
                totalDays={totalDays}
                goal={dashboardData.participant?.goal ?? participant.goal}
                streak={streakStats.current}
                daysSubmitted={streakStats.submitted}
                gender={dashboardData.profile?.gender}
              />
              <StreakCard
                startDate={dashboardData.room.startDate}
                endDate={dashboardData.room.endDate}
                submissionDates={dashboardData.submissionActivity.dates}
              />
              {/* Quotes */}
              <QuoteDisplay intervalMs={12000} />
              {/* Today's check-in */}
              <div className="mx-auto my-6 w-full">
                <h2 className="mb-3 text-sm font-semibold text-neutral-900">
                  Today&apos;s Check-in
                </h2>

                <section className="grid gap-4 md:grid-cols-2">
                  <TaskSubmissionCard
                    completed={dashboardData.today.submissionCompleted}
                    window={getWindowState(submissionDeadline)}
                    countdown={
                      submissionDeadline?.isOpen
                        ? formatCountdown(
                            submissionDeadline.millisecondsRemaining,
                          )
                        : null
                    }
                    onSubmit={openSubmissionDialog}
                    onView={() => setParticipantSubmissionDialogOpen(true)}
                    onEdit={() => setIsEditOpen(true)}
                  />

                  <PartnerCheckCard
                    completed={dashboardData.today.partnerReviewSubmitted}
                    window={getWindowState(partnerReportDeadline)}
                    countdown={
                      partnerReportDeadline?.isOpen
                        ? formatCountdown(
                            partnerReportDeadline.millisecondsRemaining,
                          )
                        : null
                    }
                    onSubmit={openReportDialog}
                    onView={() => setPartnerReportDialogOpen(true)}
                    onEdit={() => setIsEditReportOpen(true)}
                  />
                </section>
              </div>

              <PartnerProfileCard date={today} />
              <TimelinePair
                slots={
                  dashboardData.participant !== null &&
                  dashboardData.participant.graceSlotsUsed
                }
              />
            </>
          ) : (
            <div className="flex min-h-[240px] items-center justify-center">
              <p>This Result Room is not currently available.</p>
            </div>
          )}
        </div>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Daily submission dialog                                             */}
      {/* ------------------------------------------------------------------ */}
      <Dialog
        open={submissionDialogOpen}
        onOpenChange={handleSubmissionDialogOpenChange}
      >
        <DialogContent className="isolate max-h-[95vh] overflow-x-hidden overflow-y-auto rounded-[28px] border border-white/70 bg-gradient-to-br from-yellow-200 via-blue-100 to-blue-200 p-4 sm:max-w-md sm:p-5">
          <SubmissionForm
            onSubmit={handleSubmission}
            onUploadProgressChange={handleUploadProgressChange}
            submitting={submissionMutation.isPending}
            onCancel={() => handleSubmissionDialogOpenChange(false)}
            className={submissionView === "form" ? "" : "hidden"}
          />

          {submissionView === "uploading" && (
            <SubmissionUploading
              progress={submissionUploadProgress.progress}
              imageCount={submissionUploadProgress.imageCount}
              message="Uploading your evidence..."
            />
          )}

          {submissionView === "saving" && (
            <SubmissionUploading
              imageCount={lastSubmissionPayload?.files.length ?? 0}
              message="Saving your submission..."
            />
          )}

          {submissionView === "success" && (
            <SubmissionSuccess
              imageCount={lastSubmissionPayload?.files.length ?? 0}
              description={lastSubmissionPayload?.description}
              onContinue={() => handleSubmissionDialogOpenChange(false)}
            />
          )}

          {submissionView === "error" && submissionError && (
            <SubmissionError
              message={submissionError.message}
              imageCount={submissionError.imageCount}
              retrying={submissionMutation.isPending}
              onRetry={handleRetrySubmission}
              onCancel={() => handleSubmissionDialogOpenChange(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Partner report dialog                                               */}
      {/* ------------------------------------------------------------------ */}
      <Dialog
        open={reportDialogOpen}
        onOpenChange={handleReportDialogOpenChange}
      >
        <DialogContent className="isolate max-h-[95vh] overflow-x-hidden overflow-y-auto rounded-[28px] border border-white/70 bg-gradient-to-br from-yellow-200 via-blue-100 to-blue-200 p-4 sm:max-w-md sm:p-5">
          {reportView === "form" && (
            <SubmitReportForm
              onSubmit={({ comment, submittedOnTime }) =>
                handleSubmitReport(comment, submittedOnTime)
              }
              submitting={reportSubmitting}
              onCancel={() => handleReportDialogOpenChange(false)}
            />
          )}

          {reportView === "submitting" && (
            <SubmitReportUploading message="Submitting your partner report..." />
          )}

          {reportView === "success" && (
            <SubmitReportSuccess
              onContinue={() => handleReportDialogOpenChange(false)}
            />
          )}

          {reportView === "error" && reportError && (
            <SubmitReportError
              message={reportError.message}
              retrying={reportSubmitting}
              onRetry={handleRetryReport}
              onCancel={() => handleReportDialogOpenChange(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Reusable participant submission modal                                  */}
      {/* ------------------------------------------------------------------ */}
      <SubmissionViewModal
        isOpen={participantSubmissionDialogOpen}
        onClose={() => setParticipantSubmissionDialogOpen(false)}
        date={today}
        mode="own"
      />

      <PartnerReportViewModal
        isOpen={partnerReportDialogOpen}
        onClose={() => setPartnerReportDialogOpen(false)}
      />
      {/* ------------------------------------------------------------------ */}
      {/* Reusable participant update modals                                 */}
      {/* ------------------------------------------------------------------ */}
      <UpdateSubmissionModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        date={today}
      />
      <UpdatePartnerReportModal
        isOpen={isEditReportOpen}
        onClose={() => setIsEditReportOpen(false)}
      />
    </>
  );
};

export default ResultRoomDashboard;
