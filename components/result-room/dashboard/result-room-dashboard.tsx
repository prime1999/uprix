"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import goGetter from "@/app/assets/images/goGetter.jpg";
import { useResultRoomDashboard } from "@/lib/queries/result-room";
import { ResultRoomHeatmap } from "./Streak";
import { Pencil, Plus, Info } from "lucide-react";
import GeneralButton from "@/components/miscelleneous/generalButton";
import SecondaryButton from "@/components/miscelleneous/secondaryButton";
import MobileNav from "./MobileNavbar";

/*
 * --------------------------------------------------
 * TYPES
 * --------------------------------------------------
 *
 * These types describe exactly what our participant
 * status API currently returns.
 */

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

/*
 * --------------------------------------------------
 * COMPONENT
 * --------------------------------------------------
 */

const ResultRoomDashboard = () => {
  const { data: dashboardData } = useResultRoomDashboard();
  /*
   * The participant starts as null because we haven't
   * received the API response yet.
   */
  const [participant, setParticipant] = useState<Participant | null>(null);

  /*
   * Used to show the initial loading state.
   */
  const [loading, setLoading] = useState(true);

  /*
   * Stores an API/server error if one occurs.
   */
  const [error, setError] = useState<string | null>(null);

  /*
   * --------------------------------------------------
   * LOAD PARTICIPANT
   * --------------------------------------------------
   *
   * Ask our Result Room API for the authenticated
   * user's participant state.
   *
   * Authentication is handled automatically through
   * the Supabase cookies.
   */
  useEffect(() => {
    async function loadParticipant() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/result/participant", {
          /*
           * Participant status should always be fresh.
           *
           * We don't want Next/browser caching an old
           * locked/active state.
           */
          cache: "no-store",
        });

        const data = (await response.json()) as ParticipantResponse;

        /*
         * HTTP-level failure.
         */
        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load Result Room participant.",
          );
        }

        /*
         * The API responded successfully, but the user
         * does not have a participant record.
         *
         * The proxy should normally prevent this user
         * from reaching this page, but we still handle
         * it here defensively.
         */
        if (!data.participant) {
          throw new Error(
            "You are not registered as a Result Room participant.",
          );
        }

        /*
         * Store the participant information for the
         * dashboard.
         */
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

    loadParticipant();
  }, []);

  /*
   * --------------------------------------------------
   * LOADING STATE
   * --------------------------------------------------
   */
  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="flex min-h-screen items-center justify-center">
          <p>Loading Result Room...</p>
        </div>
      </main>
    );
  }

  /*
   * --------------------------------------------------
   * ERROR STATE
   * --------------------------------------------------
   */
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

  /*
   * --------------------------------------------------
   * DEFENSIVE CHECK
   * --------------------------------------------------
   *
   * TypeScript knows participant can be null, so we
   * explicitly guard against it.
   */
  if (!participant) {
    return null;
  }

  /*
   * --------------------------------------------------
   * NON-ACTIVE STATE
   * --------------------------------------------------
   *
   * Normally the proxy will already have redirected
   * pending/locked/evicted participants before they
   * reach this component.
   *
   * We still handle those states here so the component
   * isn't relying entirely on middleware.
   */
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

  /*
   * --------------------------------------------------
   * ACTIVE DASHBOARD
   * --------------------------------------------------
   *
   * This is the actual dashboard shell.
   *
   * We'll progressively replace this content with the
   * real Result Room workspace.
   */

  if (!dashboardData) {
    return <p>Loading!!!</p>;
  }
  return (
    <main className="w-full min-h-screen grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="h-full w-full md:col-span-1 lg:col-span-2 p-2">
        {dashboardData.room !== null ? (
          <>
            {" "}
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
                    {" "}
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
                {/* mobile view */}
                <div className="lg:hidden flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {" "}
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
                    {" "}
                    <SecondaryButton
                      onClick={() => console.log("edit button clicked")}
                    >
                      <Pencil className="text-white" />
                    </SecondaryButton>
                  </div>
                </div>
                {/* desktop view */}
                <div className="flex items-center gap-4">
                  {" "}
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
                {/* For mobile view */}
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

              <section className="mt-4">
                <h1 className="text-sm mb-2">Today's Check-in</h1>
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
                          {" "}
                          <Info className="size-4 text-primary-blue" />
                          <p className="text-xs md:text-sm">
                            Done with your task?.
                          </p>
                        </span>
                        <SecondaryButton
                          onClick={() =>
                            console.log("Submit task button clicked")
                          }
                        >
                          <span className="flex items-center gap-2 text-sm">
                            <Plus className="size-4 md:size-6" />
                            <p className="text-xs md:text-sm">Submit Task</p>
                          </span>
                        </SecondaryButton>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full mt-2 min-h-12 backdrop-blur-3xl border border-white py-3 px-6 shadow-md rounded-2xl">
                  <h1 className="text-sm">Partner Check</h1>
                  <div className="w-full mt-1">
                    {dashboardData.today.submissionCompleted ? (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs md:text-sm">Great Partner 👍</p>
                        <GeneralButton text="View Report" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          {" "}
                          <Info className="size-4 text-primary-blue" />
                          <p className="text-xs md:text-sm">
                            check on partner?.
                          </p>
                        </span>
                        <SecondaryButton
                          onClick={() =>
                            console.log("Submit report button clicked")
                          }
                        >
                          <span className="flex items-center gap-2 text-sm">
                            <Plus className="size-4 md:size-6" />
                            <p className="text-xs md:text-sm">Submit Report</p>
                          </span>
                        </SecondaryButton>
                      </div>
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
