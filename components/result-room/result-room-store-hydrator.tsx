"use client";

import { useEffect } from "react";

import { useResultRoomDashboard } from "@/lib/queries/result-room";
import { calculateDashboardState } from "@/lib/result-room/calculate-dashboard-state";
import { useResultRoomStore } from "@/lib/stores/result-room-store";

export function ResultRoomStoreHydrator() {
  const { data } = useResultRoomDashboard();

  const setRoomProgress = useResultRoomStore((state) => state.setRoomProgress);

  useEffect(() => {
    if (!data?.room) {
      return;
    }

    const dashboardState = calculateDashboardState({
      startDate: data.room.startDate,
      endDate: data.room.endDate,
      submissionDates: data.submissionActivity.dates,
    });

    setRoomProgress(dashboardState);
  }, [data, setRoomProgress]);

  return null;
}
