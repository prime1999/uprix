"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Pencil, Plus, Info } from "lucide-react";
import goGetter from "@/app/assets/images/goGetter.jpg";

import {
  useResultRoomDashboard,
  useCreateResultRoomSubmission,
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

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

const ResultRoomDashboard = () => {
  const { data: dashboardData } = useResultRoomDashboard();
  const submissionMutation = useCreateResultRoomSubmission();

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
  /* Submission progress                                                      */
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

    // Only return to the form if the Cloudinary upload failed.
    // Do not overwrite the saving, success, or error screens.
    setSubmissionView((current) =>
      current === "uploading" ? "form" : current,
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Save submission                                                          */
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
  /* Retry submission                                                        */
  /* ------------------------------------------------------------------------ */

  const handleRetrySubmission = async () => {
    if (!lastSubmissionPayload || submissionMutation.isPending) {
      return;
    }

    await handleSubmission(lastSubmissionPayload);
  };

  /* ------------------------------------------------------------------------ */
  /* Dialog state                                                             */
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

  const handleDialogOpenChange = (open: boolean) => {
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
    <main className="w-full min-h-screen grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="h-full w-full md:col-span-1 lg:col-span-2 p-2">
        {dashboardData.room !== null ? (
          <>
            <ResultRoomHeatmap
              startDate={dashboardData.room.startDate}
              endDate={dashboardData.room.endDate}
              submissionDates={dashboardData.submissionActivity.dates}
            />

            <div className="mx-auto w-full my-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm">Go-Getter Details</p>

                <div className="flex items-center gap-2 text-sm">
                  <div className="hidden lg:block">
                    <SecondaryButton
                      onClick={() => console.log("edit button clicked")}
                    >
                      <Pencil className="text-white" />
                    </SecondaryButton>
                  </div>

                  <GeneralButton
                    text="View Profile"
                    onClick={() => console.log("view profile button clicked")}
                  />
                </div>
              </div>

              <div className="w-full min-h-24 backdrop-blur-3xl border border-white py-3 px-6 shadow-md rounded-2xl">
                {/* Mobile view */}
                <div className="lg:hidden flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Image
                      src={goGetter}
                      alt="Go Getter"
                      className="size-12 rounded-full border border-white"
                    />

                    <h1 className="text-sm">
                      {dashboardData.profile && dashboardData.profile.name}
                    </h1>
                  </div>

                  <div className="lg:hidden">
                    <SecondaryButton
                      onClick={() => console.log("edit button clicked")}
                    >
                      <Pencil className="text-white" />
                    </SecondaryButton>
                  </div>
                </div>

                {/* Desktop view */}
                <div className="flex items-center gap-4">
                  <Image
                    src={goGetter}
                    alt="Go Getter"
                    className="hidden lg:block size-20 rounded-full border border-white"
                  />

                  <div className="w-full flex flex-col items-start gap-4">
                    <h1 className="hidden lg:block text-sm">
                      {dashboardData.profile && dashboardData.profile.name}
                    </h1>

                    <div className="w-full items-center justify-between hidden md:flex">
                      <div>
                        <p className="text-xs text-gray-500">Goal</p>
                        <h6 className="text-sm font-normal">
                          {dashboardData.participant &&
                            dashboardData.participant.goal}
                        </h6>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <h6 className="text-sm font-normal">
                          {dashboardData.participant &&
                            dashboardData.participant.email}
                        </h6>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Phone-Number</p>
                        <h6 className="text-sm font-normal">
                          {dashboardData.participant &&
                            dashboardData.participant.phone}
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile view */}
                <div className="w-full flex flex-col md:hidden">
                  <div className="flex items-center justify-between mt-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Goal</p>
                      <h6 className="text-sm font-normal">
                        {dashboardData.participant &&
                          dashboardData.participant.goal}
                      </h6>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Phone-Number</p>
                      <h6 className="text-sm font-normal">
                        {dashboardData.participant &&
                          dashboardData.participant.phone}
                      </h6>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <h6 className="text-sm font-normal">
                      {dashboardData.participant &&
                        dashboardData.participant.email}
                    </h6>
                  </div>
                </div>
              </div>

              {/* Today's check-in */}
              <section className="mt-4">
                <h1 className="text-sm mb-2">Today&apos;s Check-in</h1>

                {/* Task submission */}
                <div className="w-full min-h-12 backdrop-blur-3xl border border-white py-3 px-6 shadow-md rounded-2xl">
                  <h1 className="text-sm">Task Submission</h1>

                  <div className="w-full mt-1">
                    {dashboardData.today.submissionCompleted ? (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs md:text-sm">Welldone 👍</p>
                        <GeneralButton text="View Submission" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
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
                            onOpenChange={handleDialogOpenChange}
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

                            <DialogContent className="max-h-[95vh] isolate overflow-y-auto overflow-x-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-yellow-200 via-blue-100 to-blue-200 p-4 sm:p-5 sm:max-w-md">
                              {/* Keep the form mounted during upload and save.
                                  This prevents its refs and local state from
                                  being destroyed when the status screen appears. */}
                              <SubmissionForm
                                onSubmit={handleSubmission}
                                onUploadProgressChange={
                                  handleUploadProgressChange
                                }
                                submitting={submissionMutation.isPending}
                                onCancel={() => handleDialogOpenChange(false)}
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
                                    handleDialogOpenChange(false)
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
                                      handleDialogOpenChange(false)
                                    }
                                  />
                                )}
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <SecondaryButton disabled>
                            <span className="flex items-center gap-2 text-sm">
                              <Plus className="size-4 md:size-6" />
                              <p className="text-xs md:text-sm">
                                Submission Closed
                              </p>
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
                <div className="w-full mt-2 min-h-12 backdrop-blur-3xl border border-white py-3 px-6 shadow-md rounded-2xl">
                  <h1 className="text-sm">Partner Check</h1>

                  <div className="w-full mt-1">
                    {dashboardData.today.partnerReviewSubmitted ? (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs md:text-sm">Great Partner 👍</p>
                        <GeneralButton text="View Report" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <Info className="size-4 text-primary-blue" />

                          <p className="text-xs md:text-sm">
                            {partnerReportDeadline?.isOpen
                              ? "Check on your partner?"
                              : "Partner reporting is closed."}
                          </p>
                        </span>

                        {partnerReportDeadline?.isOpen ? (
                          <SecondaryButton
                            onClick={() =>
                              console.log("Submit report button clicked")
                            }
                          >
                            <span className="flex items-center gap-2 text-sm">
                              <Plus className="size-4 md:size-6" />
                              <p className="text-xs md:text-sm">
                                Submit Report
                              </p>
                            </span>
                          </SecondaryButton>
                        ) : (
                          <SecondaryButton disabled>
                            <span className="flex items-center gap-2 text-sm">
                              <Plus className="size-4 md:size-6" />
                              <p className="text-xs md:text-sm">
                                Report Closed
                              </p>
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
              </section>
            </div>
          </>
        ) : (
          <p>Loading!!!</p>
        )}

        <MobileNav />
      </div>

      <div className="h-full hidden lg:block md:col-span-1">vsadhv</div>
    </main>
  );
};

export default ResultRoomDashboard;
