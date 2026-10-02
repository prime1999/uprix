export interface CalculateDashboardStateInput {
  /**
   * Raw room dates coming from the API.
   */
  startDate: string;
  endDate: string;

  /**
   * Dates on which the participant submitted work.
   */
  submissionDates: string[];

  /**
   * Optional "now" value.
   *
   * This is mainly useful for testing.
   *
   * If omitted, the participant's browser local time is used.
   */
  today?: Date;
}

export interface DashboardDerivedState {
  /**
   * Current day of the Result Room.
   *
   * Before the room starts:
   * 0
   *
   * On the first day:
   * 1
   *
   * On the second day:
   * 2
   *
   * etc.
   */
  currentDay: number;

  /**
   * Number of days remaining in the room.
   */
  daysRemaining: number;

  /**
   * Total number of days in the room.
   */
  totalDays: number;

  /**
   * Percentage of the room timeline that has elapsed.
   */
  roomProgress: number;

  /**
   * Whether the participant has submitted work today.
   */
  hasSubmittedToday: boolean;

  /**
   * Dates used by the activity heatmap.
   */
  heatmapDates: string[];

  /**
   * Whether the room has started according to the
   * participant's local calendar date.
   */
  hasStarted: boolean;

  /**
   * Whether the room has ended according to the
   * participant's local calendar date.
   */
  hasEnded: boolean;
}

/**
 * Convert a Date object into a calendar date string
 * using the participant's LOCAL timezone.
 *
 * Example:
 *
 * 2026-10-18T00:30 in Lagos
 *       ↓
 * "2026-10-18"
 *
 * We deliberately do NOT use toISOString() here because
 * toISOString() converts the date to UTC first.
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Convert a YYYY-MM-DD calendar date into a UTC-midnight
 * Date object.
 *
 * IMPORTANT:
 *
 * This UTC Date object is only being used as a neutral
 * representation of a calendar date so that we can safely
 * calculate the difference between two dates.
 *
 * It does NOT represent the participant's actual timezone.
 */
function calendarDateToUTCDate(dateString: string): Date {
  return new Date(`${dateString}T00:00:00Z`);
}

/**
 * Calculate the number of calendar days between two
 * YYYY-MM-DD dates.
 *
 * Example:
 *
 * 2026-10-18 → 2026-10-18 = 0
 * 2026-10-19 → 2026-10-18 = 1
 * 2026-10-20 → 2026-10-18 = 2
 */
function differenceInCalendarDays(
  currentDate: string,
  startDate: string,
): number {
  const current = calendarDateToUTCDate(currentDate);

  const start = calendarDateToUTCDate(startDate);

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.floor((current.getTime() - start.getTime()) / millisecondsPerDay);
}

/**
 * Calculate all client-side dashboard state.
 *
 * This function is intentionally pure:
 *
 * API data comes in.
 * Current browser date is used.
 * Derived dashboard values come out.
 *
 * No API calls.
 * No Zustand.
 * No React Query.
 * No database access.
 */
export function calculateDashboardState({
  startDate,
  endDate,
  submissionDates,
  today = new Date(),
}: CalculateDashboardStateInput): DashboardDerivedState {
  /**
   * ------------------------------------------------------------
   * 1. Determine the participant's local calendar date
   * ------------------------------------------------------------
   */
  const todayString = formatLocalDate(today);

  /**
   * ------------------------------------------------------------
   * 2. Calculate the total room duration
   * ------------------------------------------------------------
   *
   * The dates are inclusive.
   *
   * Example:
   *
   * Oct 18 → Oct 18 = 1 day
   * Oct 18 → Oct 19 = 2 days
   *
   * Therefore we add 1.
   */
  const totalDays = differenceInCalendarDays(endDate, startDate) + 1;

  /**
   * ------------------------------------------------------------
   * 3. Calculate current room day
   * ------------------------------------------------------------
   *
   * Oct 17 → Day 0
   * Oct 18 → Day 1
   * Oct 19 → Day 2
   *
   * This is exactly the behavior we want.
   */
  const calculatedDay = differenceInCalendarDays(todayString, startDate) + 1;

  /**
   * Prevent currentDay from going below 0 or above
   * the total room duration.
   */
  const currentDay = Math.max(0, Math.min(calculatedDay, totalDays));

  /**
   * ------------------------------------------------------------
   * 4. Calculate room progress
   * ------------------------------------------------------------
   */
  const roomProgress =
    currentDay > 0 && totalDays > 0
      ? Math.round((currentDay / totalDays) * 100 * 10) / 10
      : 0;

  /**
   * ------------------------------------------------------------
   * 5. Calculate remaining days
   * ------------------------------------------------------------
   */
  const daysRemaining = Math.max(totalDays - currentDay, 0);

  /**
   * ------------------------------------------------------------
   * 6. Determine whether the room has started/ended
   * ------------------------------------------------------------
   */
  const hasStarted = todayString >= startDate;

  const hasEnded = todayString > endDate;

  /**
   * ------------------------------------------------------------
   * 7. Determine whether today's work was submitted
   * ------------------------------------------------------------
   *
   * We compare calendar-date strings directly.
   *
   * This is why YYYY-MM-DD is useful here.
   */
  const submissionDateSet = new Set(submissionDates);

  const hasSubmittedToday = submissionDateSet.has(todayString);

  /**
   * ------------------------------------------------------------
   * 8. Return derived dashboard state
   * ------------------------------------------------------------
   */
  return {
    currentDay,
    daysRemaining,
    totalDays,
    roomProgress,
    hasSubmittedToday,
    heatmapDates: submissionDates,
    hasStarted,
    hasEnded,
  };
}
