import { create } from "zustand";

import type { DashboardDerivedState } from "@/lib/result-room/calculate-dashboard-state";

/**
 * ==========================================================================
 * TYPES
 * ==========================================================================
 */

/**
 * Client-only UI state + client-derived Result Room state.
 *
 * IMPORTANT:
 *
 * This store does NOT contain the raw dashboard API response.
 *
 * React Query remains the source of truth for server data.
 *
 * Zustand only contains:
 *
 * 1. Client-only UI state
 * 2. Values derived from React Query data by
 *    calculateDashboardState()
 */
interface ResultRoomUIState {
  /**
   * ------------------------------------------------------------------------
   * CLIENT-ONLY UI STATE
   * ------------------------------------------------------------------------
   */

  /**
   * Whether the daily submission modal is currently open.
   */
  isSubmissionModalOpen: boolean;

  /**
   * Date currently selected in the activity/heatmap UI.
   */
  selectedDate: string | null;

  /**
   * Current activity filter.
   */
  activityFilter: string;

  /**
   * ------------------------------------------------------------------------
   * CLIENT-DERIVED ROOM STATE
   * ------------------------------------------------------------------------
   *
   * This is calculated from React Query data.
   *
   * It is NOT fetched from the API.
   */
  roomProgress: DashboardDerivedState | null;
}

/**
 * ==========================================================================
 * ACTIONS
 * ==========================================================================
 */

interface ResultRoomActions {
  /**
   * Open the daily submission modal.
   */
  openSubmissionModal: () => void;

  /**
   * Close the daily submission modal.
   */
  closeSubmissionModal: () => void;

  /**
   * Select a specific activity date.
   */
  setSelectedDate: (date: string | null) => void;

  /**
   * Change the activity filter.
   */
  setActivityFilter: (filter: string) => void;

  /**
   * Store the latest client-derived room progress.
   *
   * This is called after:
   *
   * React Query data
   *        ↓
   * calculateDashboardState()
   *        ↓
   * setRoomProgress()
   */
  setRoomProgress: (roomProgress: DashboardDerivedState) => void;

  /**
   * Clear the calculated room progress.
   *
   * Useful when the participant leaves the room/dashboard
   * or when the underlying server data becomes unavailable.
   */
  clearRoomProgress: () => void;

  /**
   * Reset all client-side Result Room state.
   */
  resetUIState: () => void;
}

/**
 * ==========================================================================
 * INITIAL STATE
 * ==========================================================================
 */

const initialUIState: ResultRoomUIState = {
  isSubmissionModalOpen: false,
  selectedDate: null,
  activityFilter: "all",
  roomProgress: null,
};

/**
 * ==========================================================================
 * STORE
 * ==========================================================================
 */

export const useResultRoomStore = create<ResultRoomUIState & ResultRoomActions>(
  (set) => ({
    /**
     * Initial state.
     */
    ...initialUIState,

    /**
     * ------------------------------------------------------------------------
     * SUBMISSION MODAL
     * ------------------------------------------------------------------------
     */

    openSubmissionModal: () =>
      set({
        isSubmissionModalOpen: true,
      }),

    closeSubmissionModal: () =>
      set({
        isSubmissionModalOpen: false,
      }),

    /**
     * ------------------------------------------------------------------------
     * ACTIVITY UI
     * ------------------------------------------------------------------------
     */

    setSelectedDate: (date) =>
      set({
        selectedDate: date,
      }),

    setActivityFilter: (filter) =>
      set({
        activityFilter: filter,
      }),

    /**
     * ------------------------------------------------------------------------
     * DERIVED ROOM STATE
     * ------------------------------------------------------------------------
     */

    setRoomProgress: (roomProgress) =>
      set({
        roomProgress,
      }),

    clearRoomProgress: () =>
      set({
        roomProgress: null,
      }),

    /**
     * ------------------------------------------------------------------------
     * RESET
     * ------------------------------------------------------------------------
     */

    resetUIState: () =>
      set({
        ...initialUIState,
      }),
  }),
);
