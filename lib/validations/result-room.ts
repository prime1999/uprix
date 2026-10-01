import { z } from "zod";

/**
 * ---------------------------------------------------------
 * RESULT ROOM STATUS
 * ---------------------------------------------------------
 *
 * These values must match the `participants.room_status`
 * values in Supabase.
 *
 * We use z.enum() instead of a plain string so Zod will
 * reject unexpected values at runtime.
 */
export const resultRoomStatusSchema = z.enum([
  "pending",
  "active",
  "locked",
  "evicted",
]);

/**
 * ---------------------------------------------------------
 * USER PROFILE
 * ---------------------------------------------------------
 *
 * Represents the profile information returned to the
 * Result Room dashboard.
 */
export const resultRoomProfileSchema = z.object({
  /**
   * Supabase user/profile ID.
   */
  id: z.string().uuid(),

  /**
   * Authenticated user's email address.
   */
  email: z.string().email(),

  /**
   * User's display name.
   *
   * Nullable because a profile may not have a name yet.
   */
  name: z.string().nullable(),

  /**
   * Profile avatar URL.
   *
   * Nullable because users don't necessarily have an avatar.
   */
  avatar: z.string().nullable(),
});

/**
 * ---------------------------------------------------------
 * RESULT ROOM PARTICIPANT
 * ---------------------------------------------------------
 *
 * Represents the user's participation in the current
 * Result Room.
 */
export const resultRoomParticipantSchema = z.object({
  /**
   * Participant record ID.
   */
  id: z.string().uuid(),

  /**
   * Current Result Room access state.
   *
   * IMPORTANT:
   * This is `roomStatus`, not a generic `status`.
   */
  roomStatus: resultRoomStatusSchema,

  /**
   * Whether this participant is an administrator.
   */
  isAdmin: z.boolean(),

  /**
   * Administrator role, if applicable.
   *
   * Normal participants will have null here.
   */
  adminRole: z.string().nullable(),

  /**
   * Explanation for a locked/evicted/pending state.
   *
   * Normally null for active participants.
   */
  statusReason: z.string().nullable(),

  /**
   * When the participant's room status last changed.
   */
  statusChangedAt: z.string().nullable(),
});

/**
 * ---------------------------------------------------------
 * RESULT ROOM
 * ---------------------------------------------------------
 *
 * Represents the current Result Room itself.
 *
 * The room dates come from the existing `rooms` table.
 */
export const resultRoomSchema = z.object({
  /**
   * Room ID.
   */
  id: z.string().uuid(),

  /**
   * Room name.
   */
  name: z.string(),

  /**
   * Optional room description.
   */
  description: z.string().nullable(),

  /**
   * Room lifecycle status.
   *
   * This is deliberately separate from participant.roomStatus.
   *
   * `rooms.status` describes the ROOM.
   * `participants.room_status` describes the PARTICIPANT.
   */
  status: z.string(),

  /**
   * Room start date.
   *
   * Example:
   * "2026-10-18"
   */
  startDate: z.string(),

  /**
   * Room end date.
   *
   * Example:
   * "2027-01-16"
   */
  endDate: z.string(),

  /**
   * Number of calendar days in the room.
   *
   * Result Room 2.0 = 90 days.
   */
  totalDays: z.number().int().nonnegative(),

  /**
   * Current day according to the room timeline.
   *
   * IMPORTANT:
   * This is NOT the participant's personal streak.
   */
  currentDay: z.number().int().nonnegative(),

  /**
   * Percentage of the room timeline that has elapsed.
   */
  progressPercentage: z.number().min(0).max(100),
});

/**
 * ---------------------------------------------------------
 * COMPLETE DASHBOARD RESPONSE
 * ---------------------------------------------------------
 *
 * Instead of defining the profile, participant and room
 * fields again, we compose the schemas above.
 *
 * This gives us one source of truth.
 */
export const resultRoomDashboardSchema = z.object({
  /**
   * Allows us to confirm that this is a successful API
   * response.
   */
  success: z.literal(true),

  /**
   * Profile may be null if the API doesn't find one.
   */
  profile: resultRoomProfileSchema.nullable(),

  /**
   * Participant may be null for a normal Uprix user who
   * isn't a Result Room participant.
   */
  participant: resultRoomParticipantSchema.nullable(),

  /**
   * Room may be null if there is currently no room.
   */
  room: resultRoomSchema.nullable(),
});

/**
 * ---------------------------------------------------------
 * TYPES
 * ---------------------------------------------------------
 *
 * Zod can generate TypeScript types from our schemas.
 *
 * This means we don't need to maintain separate interfaces
 * for the same API objects.
 */

export type ResultRoomStatus = z.infer<typeof resultRoomStatusSchema>;

export type ResultRoomProfile = z.infer<typeof resultRoomProfileSchema>;

export type ResultRoomParticipant = z.infer<typeof resultRoomParticipantSchema>;

export type ResultRoom = z.infer<typeof resultRoomSchema>;

export type ResultRoomDashboard = z.infer<typeof resultRoomDashboardSchema>;
