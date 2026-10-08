import { addDays, format, isBefore, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

/**
 * Result Room daily deadlines.
 *
 * All times are interpreted in the participant's
 * local timezone.
 */

/**
 * Daily participant submission cutoff.
 *
 * 21:00 = 9:00 PM
 */
export const DAILY_SUBMISSION_CUTOFF_HOUR = 21;
export const DAILY_SUBMISSION_CUTOFF_MINUTE = 0;

/**
 * Partner report/review cutoff.
 *
 * 21:30 = 9:30 PM
 */
export const PARTNER_REPORT_CUTOFF_HOUR = 21;
export const PARTNER_REPORT_CUTOFF_MINUTE = 30;

export interface DeadlineState {
  /**
   * Participant's IANA timezone.
   *
   * Example:
   * Africa/Lagos
   */
  timezone: string;

  /**
   * Participant's local calendar date.
   *
   * Example:
   * 2026-10-08
   */
  localDate: string;

  /**
   * Exact absolute instant at which
   * the deadline occurs.
   */
  deadline: Date;

  /**
   * Whether the deadline is still open.
   *
   * At the exact deadline time this becomes false.
   */
  isOpen: boolean;

  /**
   * Milliseconds remaining until the deadline.
   *
   * Returns 0 after the deadline has passed.
   */
  millisecondsRemaining: number;
}

/**
 * Get the participant's IANA timezone from
 * their browser.
 *
 * Examples:
 * Africa/Lagos
 * Europe/London
 * Asia/Kolkata
 * America/New_York
 *
 * This should only be called on the client.
 */
export function getParticipantTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Create a deadline at a specific local time.
 *
 * The hour and minute are interpreted inside
 * the participant's timezone.
 */
function createLocalDeadline(
  timezone: string,
  now: Date,
  hour: number,
  minute: number,
): DeadlineState {
  /**
   * Convert the current absolute instant into
   * the participant's local timezone.
   */
  const zonedNow = toZonedTime(now, timezone);

  /**
   * Get the participant's local calendar date.
   */
  const localDate = format(zonedNow, "yyyy-MM-dd");

  /**
   * Get local midnight.
   */
  const localMidnight = startOfDay(zonedNow);

  /**
   * Build the deadline using local calendar time.
   */
  const localDeadline = new Date(localMidnight);

  localDeadline.setHours(hour, minute, 0, 0);

  /**
   * Convert the local deadline back into an
   * absolute instant.
   */
  const deadline = fromZonedTime(localDeadline, timezone);

  /**
   * Deadline is open strictly before the cutoff.
   *
   * At exactly 21:00 or 21:30, depending on
   * the rule, submission/reporting is closed.
   */
  const isOpen = isBefore(now, deadline);

  /**
   * Never return a negative countdown.
   */
  const millisecondsRemaining = Math.max(deadline.getTime() - now.getTime(), 0);

  return {
    timezone,
    localDate,
    deadline,
    isOpen,
    millisecondsRemaining,
  };
}

/**
 * Get today's participant submission deadline.
 *
 * Rule:
 *
 * Participants can submit until 9:00 PM
 * in their own local timezone.
 */
export function getDailySubmissionDeadline(
  timezone: string,
  now: Date = new Date(),
): DeadlineState {
  return createLocalDeadline(
    timezone,
    now,
    DAILY_SUBMISSION_CUTOFF_HOUR,
    DAILY_SUBMISSION_CUTOFF_MINUTE,
  );
}

/**
 * Get today's partner report/review deadline.
 *
 * Rule:
 *
 * Partner reports/reviews close at 9:30 PM
 * in the partner's own local timezone.
 */
export function getPartnerReportDeadline(
  timezone: string,
  now: Date = new Date(),
): DeadlineState {
  return createLocalDeadline(
    timezone,
    now,
    PARTNER_REPORT_CUTOFF_HOUR,
    PARTNER_REPORT_CUTOFF_MINUTE,
  );
}

/**
 * Get the next day's participant submission deadline.
 *
 * Useful when today's 9:00 PM deadline has passed.
 */
export function getNextDailySubmissionDeadline(
  timezone: string,
  now: Date = new Date(),
): Date {
  const zonedNow = toZonedTime(now, timezone);

  /**
   * Move to the next local calendar day.
   */
  const nextLocalDay = addDays(startOfDay(zonedNow), 1);

  nextLocalDay.setHours(
    DAILY_SUBMISSION_CUTOFF_HOUR,
    DAILY_SUBMISSION_CUTOFF_MINUTE,
    0,
    0,
  );

  return fromZonedTime(nextLocalDay, timezone);
}

/**
 * Get the next day's partner report deadline.
 */
export function getNextPartnerReportDeadline(
  timezone: string,
  now: Date = new Date(),
): Date {
  const zonedNow = toZonedTime(now, timezone);

  /**
   * Move to the next local calendar day.
   */
  const nextLocalDay = addDays(startOfDay(zonedNow), 1);

  nextLocalDay.setHours(
    PARTNER_REPORT_CUTOFF_HOUR,
    PARTNER_REPORT_CUTOFF_MINUTE,
    0,
    0,
  );

  return fromZonedTime(nextLocalDay, timezone);
}

/**
 * Generic helper for checking whether a deadline
 * has passed.
 */
export function isDeadlinePassed(
  deadline: Date,
  now: Date = new Date(),
): boolean {
  return now.getTime() >= deadline.getTime();
}

/**
 * Generic helper for calculating the amount
 * of time remaining until a deadline.
 *
 * Returns 0 when the deadline has passed.
 */
export function getTimeRemaining(
  deadline: Date,
  now: Date = new Date(),
): number {
  return Math.max(deadline.getTime() - now.getTime(), 0);
}
