import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * GET /api/result/dashboard
 *
 * Returns the data needed to initialize the Result Room dashboard.
 *
 * At this stage we return:
 * - Authenticated user's basic profile information
 * - Current Result Room information
 * - Participant's Result Room status
 *
 * Streak information will be added later when we build the
 * daily submission/activity system.
 */
export async function GET() {
  /**
   * Create a Supabase server client using the user's
   * existing authentication cookies.
   *
   * This means the browser does NOT need to manually send
   * an access token to this API.
   */
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /**
             * Some server contexts may not allow cookies to be
             * written. Authentication still works because the
             * request cookies can be read.
             */
          }
        },
      },
    },
  );

  /**
   * Get the currently authenticated user.
   *
   * getClaims() is consistent with the authentication approach
   * already used in your middleware.
   */
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const user = claimsData?.claims;

  /**
   * If there is no authenticated user, the dashboard API
   * should not expose any information.
   */
  if (claimsError || !user) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  /**
   * ----------------------------------------------------------
   * 1. GET PARTICIPANT
   * ----------------------------------------------------------
   *
   * We use the authenticated user's Supabase Auth ID to find
   * their Result Room participant record.
   */
  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .select(
      `
          id,
          room_status,
          is_admin,
          admin_role,
          status_reason,
          status_changed_at
        `,
    )
    .eq("user_id", user.sub)
    .maybeSingle();

  if (participantError) {
    console.error("Error fetching Result Room participant:", participantError);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load participant information",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  /**
   * A user can be authenticated on Uprix without being a
   * Result Room participant.
   *
   * We return participant: null instead of treating that as
   * a server error.
   */
  if (!participant) {
    return NextResponse.json(
      {
        success: true,
        participant: null,
        room: null,
        profile: {
          id: user.sub,
          email: user.email ?? null,

          /**
           * Supabase Auth metadata can contain the user's
           * display name and avatar depending on how the
           * account was created.
           */
          name:
            typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : typeof user.user_metadata?.name === "string"
                ? user.user_metadata.name
                : null,

          avatar:
            typeof user.user_metadata?.avatar_url === "string"
              ? user.user_metadata.avatar_url
              : null,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  /**
   * ----------------------------------------------------------
   * 2. GET THE CURRENT RESULT ROOM
   * ----------------------------------------------------------
   *
   * For now Result Room has one room, so we retrieve the
   * most recently created room.
   *
   * Later, if Uprix supports multiple cohorts/rooms, this
   * query can be changed to select the participant's room_id.
   */
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select(
      `
        id,
        name,
        description,
        status,
        start_date,
        end_date
      `,
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roomError) {
    console.error("Error fetching Result Room:", roomError);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load Result Room information",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  /**
   * ----------------------------------------------------------
   * 3. CALCULATE THE 90-DAY SESSION POSITION
   * ----------------------------------------------------------
   *
   * We derive the number of the current day from the room's
   * start_date.
   *
   * Example:
   *
   * October 18 = Day 1
   * October 19 = Day 2
   * October 20 = Day 3
   *
   * We intentionally calculate this rather than storing
   * "current_day" in the database.
   */
  let currentDay = 0;
  let totalDays = 0;
  let progressPercentage = 0;

  if (room) {
    /**
     * Parse the date as UTC midnight.
     *
     * This prevents the user's local timezone from accidentally
     * changing the calendar day.
     */
    const startDate = new Date(`${room.start_date}T00:00:00Z`);
    const endDate = new Date(`${room.end_date}T00:00:00Z`);

    const now = new Date();

    /**
     * Convert today's date to UTC midnight so we compare
     * calendar dates rather than exact timestamps.
     */
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    /**
     * Calculate the total number of days in the room.
     *
     * +1 makes the range inclusive:
     *
     * Oct 18 → Oct 18 = 1 day
     * Oct 18 → Oct 19 = 2 days
     */
    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    totalDays =
      Math.round(
        (endDate.getTime() - startDate.getTime()) / millisecondsPerDay,
      ) + 1;

    /**
     * Calculate which session day today represents.
     */
    const calculatedDay =
      Math.floor((today.getTime() - startDate.getTime()) / millisecondsPerDay) +
      1;

    /**
     * Before the room starts:
     * currentDay = 0
     *
     * During the room:
     * currentDay = 1 → 90
     *
     * After the room ends:
     * currentDay = 90
     */
    currentDay = Math.max(0, Math.min(calculatedDay, totalDays));

    /**
     * Progress is only based on the current position in
     * the 90-day session. It is NOT the user's streak.
     *
     * We will calculate the actual streak separately later.
     */
    if (currentDay > 0 && totalDays > 0) {
      progressPercentage = Math.round((currentDay / totalDays) * 100 * 10) / 10;
    }
  }

  /**
   * ----------------------------------------------------------
   * 4. RETURN DASHBOARD DATA
   * ----------------------------------------------------------
   */
  return NextResponse.json(
    {
      success: true,

      profile: {
        id: user.sub,
        email: user.email ?? null,

        /**
         * We use Supabase Auth metadata for now.
         *
         * If your Uprix profile table contains the canonical
         * name/avatar, we can switch this to that source once
         * we inspect its exact schema.
         */
        name:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : typeof user.user_metadata?.name === "string"
              ? user.user_metadata.name
              : null,

        avatar:
          typeof user.user_metadata?.avatar_url === "string"
            ? user.user_metadata.avatar_url
            : null,
      },

      participant: {
        id: participant.id,
        roomStatus: participant.room_status,
        isAdmin: participant.is_admin,
        adminRole: participant.admin_role,
        statusReason: participant.status_reason,
        statusChangedAt: participant.status_changed_at,
      },

      room: room
        ? {
            id: room.id,
            name: room.name,
            description: room.description,
            status: room.status,
            startDate: room.start_date,
            endDate: room.end_date,

            /**
             * This should be 90 for your current room.
             */
            totalDays,

            /**
             * 0 before the room starts,
             * 1 on the first day,
             * 90 on the final day.
             */
            currentDay,

            /**
             * This is session progress, NOT the participant's
             * personal streak.
             */
            progressPercentage,
          }
        : null,
    },
    {
      headers: {
        /**
         * Dashboard information should always be fresh.
         *
         * We don't want Next.js/browser caching an old
         * participant status or room state.
         */
        "Cache-Control": "no-store",
      },
    },
  );
}
