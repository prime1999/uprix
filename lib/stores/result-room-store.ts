import { create } from "zustand";

/**
 * ---------------------------------------------------------
 * RESULT ROOM UI STORE
 * ---------------------------------------------------------
 *
 * This store contains CLIENT-SIDE state for the Result Room.
 *
 * IMPORTANT:
 *
 * React Query owns server state:
 *
 *   - participant
 *   - profile
 *   - room
 *   - submissions
 *   - partner
 *   - fines
 *
 * Zustand owns:
 *
 *   - UI state
 *   - selected UI values
 *   - derived values prepared for the UI
 *
 * We deliberately do NOT store the complete participant,
 * profile, or room objects here.
 */

/**
 * The values that can be used by the dashboard UI.
 *
 * These values are derived from server data rather than being
 * independent database records.
 */
interface ResultRoomDerivedState {
  /**
   * Current consecutive submission streak.
   *
   * Example:
   *
   *   7 days of qualifying submissions → currentStreak = 7
   */
  currentStreak: number;

  /**
   * User's highest streak during the room.
   */
  longestStreak: number;

  /**
   * Current day of the Result Room.
   *
   * Example:
   *
   *   Day 1 → 1
   *   Day 45 → 45
   *   Day 90 → 90
   */
  currentDay: number;

  /**
   * Number of days remaining in the room.
   */
  daysRemaining: number;

  /**
   * Percentage of the room timeline completed.
   *
   * Example:
   *
   *   45 / 90 → 50
   */
  roomProgress: number;
}

/**
 * UI-only state.
 *
 * These values exist because of user interaction with the
 * dashboard rather than because they exist in Supabase.
 */
interface ResultRoomUIState {
  /**
   * Whether the daily submission modal is open.
   */
  isSubmissionModalOpen: boolean;

  /**
   * Date currently selected by the user.
   *
   * Useful later for viewing previous submissions/activity.
   *
   * null means no date has been explicitly selected.
   */
  selectedDate: string | null;

  /**
   * Current activity filter.
   *
   * We keep this flexible for now because we haven't finalized
   * the Activity page filters yet.
   */
  activityFilter: string;
}

/**
 * ---------------------------------------------------------
 * STORE ACTIONS
 * ---------------------------------------------------------
 *
 * Actions are the only way components should intentionally
 * change store state.
 */
interface ResultRoomActions {
  /**
   * Update all derived dashboard values at once.
   *
   * This will be called by our dashboard data/calculation
   * layer when fresh server data is available.
   */
  setDerivedState: (state: ResultRoomDerivedState) => void;

  /**
   * Reset derived values.
   *
   * Useful when the user leaves the Result Room context or
   * when we need to clear stale calculated state.
   */
  resetDerivedState: () => void;

  /**
   * Open the daily submission modal.
   */
  openSubmissionModal: () => void;

  /**
   * Close the daily submission modal.
   */
  closeSubmissionModal: () => void;

  /**
   * Select a specific date.
   */
  setSelectedDate: (date: string | null) => void;

  /**
   * Change the activity filter.
   */
  setActivityFilter: (filter: string) => void;

  /**
   * Reset UI state to its initial values.
   */
  resetUIState: () => void;
}

/**
 * ---------------------------------------------------------
 * INITIAL VALUES
 * ---------------------------------------------------------
 */

const initialDerivedState: ResultRoomDerivedState = {
  currentStreak: 0,
  longestStreak: 0,
  currentDay: 0,
  daysRemaining: 0,
  roomProgress: 0,
};

const initialUIState: ResultRoomUIState = {
  isSubmissionModalOpen: false,
  selectedDate: null,
  activityFilter: "all",
};

/**
 * ---------------------------------------------------------
 * ZUSTAND STORE
 * ---------------------------------------------------------
 *
 * This is the single Result Room client-side store.
 */
export const useResultRoomStore = create<
  ResultRoomDerivedState & ResultRoomUIState & ResultRoomActions
>((set) => ({
  /**
   * Initial derived values.
   */
  ...initialDerivedState,

  /**
   * Initial UI values.
   */
  ...initialUIState,

  /**
   * -------------------------------------------------------
   * DERIVED STATE ACTIONS
   * -------------------------------------------------------
   */

  setDerivedState: (state) =>
    set({
      ...state,
    }),

  resetDerivedState: () =>
    set({
      ...initialDerivedState,
    }),

  /**
   * -------------------------------------------------------
   * SUBMISSION MODAL
   * -------------------------------------------------------
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
   * -------------------------------------------------------
   * DATE SELECTION
   * -------------------------------------------------------
   */

  setSelectedDate: (date) =>
    set({
      selectedDate: date,
    }),

  /**
   * -------------------------------------------------------
   * ACTIVITY FILTER
   * -------------------------------------------------------
   */

  setActivityFilter: (filter) =>
    set({
      activityFilter: filter,
    }),

  /**
   * -------------------------------------------------------
   * RESET UI STATE
   * -------------------------------------------------------
   */

  resetUIState: () =>
    set({
      ...initialUIState,
    }),
}));
