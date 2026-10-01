"use client";

import { useEffect, useState } from "react";

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
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header>
          <p className="text-sm text-muted-foreground">Result Room</p>
          <h1 className="mt-1 text-2xl font-semibold">Your workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your daily Result Room activities from here.
          </p>
        </header>
        <section className="mt-8">
          <div className="rounded-xl border p-6">
            <h2 className="text-lg font-semibold">Welcome to Result Room</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your participant workspace is ready. We will build your tasks,
              partner activity, submissions, fines, and streak here.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ResultRoomDashboard;
