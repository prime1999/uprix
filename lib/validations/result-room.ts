import { z } from "zod";

/**
 * Participant access status inside a Result Room.
 */
export const resultRoomStatusSchema = z.enum([
  "pending",
  "active",
  "locked",
  "evicted",
]);

/**
 * Basic authenticated user's profile information.
 */
export const resultRoomProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  name: z.string().nullable(),
});

/**
 * Participant-specific information.
 */
export const resultRoomParticipantSchema = z.object({
  id: z.string().uuid(),
  roomStatus: resultRoomStatusSchema,
  isAdmin: z.boolean(),
  email: z.email(),
  goal: z.string().nullable(),
  phone: z.string().nullable(),
  adminRole: z.string().nullable(),
  statusReason: z.string().nullable(),
  statusChangedAt: z.string().nullable(),
});

/**
 * Raw room information returned by the API.
 *
 * IMPORTANT:
 * The API does NOT calculate:
 * - totalDays
 * - currentDay
 * - progressPercentage
 * - hasStarted
 * - hasEnded
 *
 * Those are calculated on the client by
 * calculate-dashboard-state.ts using the participant's
 * local calendar date.
 */
export const resultRoomSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export const resultRoomTodaySchema = z.object({
  date: z.string(),
  submissionCompleted: z.boolean(),
  partnerReviewSubmitted: z.boolean(),
});

/**
 * Only submission dates are returned for the dashboard heatmap.
 *
 * We intentionally do not return the complete submission records here.
 */
export const resultRoomSubmissionActivitySchema = z.object({
  dates: z.array(z.string()),
});

export const resultRoomAccountabilitySchema = z.object({
  hasViolation: z.boolean(),
  hasPendingFine: z.boolean(),
  hasOverdueFine: z.boolean(),
});

/**
 * Raw dashboard response from the API.
 *
 * This is server state.
 *
 * Timeline/derived state is calculated separately on the client.
 */
export const resultRoomDashboardSchema = z.object({
  success: z.literal(true),
  profile: resultRoomProfileSchema.nullable(),
  participant: resultRoomParticipantSchema.nullable(),
  room: resultRoomSchema.nullable(),
  today: resultRoomTodaySchema,
  submissionActivity: resultRoomSubmissionActivitySchema,
  accountability: resultRoomAccountabilitySchema,
});

export type ResultRoomStatus = z.infer<typeof resultRoomStatusSchema>;
export type ResultRoomProfile = z.infer<typeof resultRoomProfileSchema>;
export type ResultRoomParticipant = z.infer<typeof resultRoomParticipantSchema>;
export type ResultRoom = z.infer<typeof resultRoomSchema>;
export type ResultRoomToday = z.infer<typeof resultRoomTodaySchema>;
export type ResultRoomSubmissionActivity = z.infer<
  typeof resultRoomSubmissionActivitySchema
>;
export type ResultRoomAccountability = z.infer<
  typeof resultRoomAccountabilitySchema
>;
export type ResultRoomDashboard = z.infer<typeof resultRoomDashboardSchema>;
