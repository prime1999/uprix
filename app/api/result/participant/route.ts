import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/*
 * --------------------------------------------------
 * RESULT ROOM PARTICIPANT STATUS API
 * --------------------------------------------------
 *
 * Endpoint:
 *
 * GET /api/result/participant
 *
 * This endpoint determines the Result Room state of
 * the currently authenticated user.
 *
 * Possible participant statuses:
 *
 * - active
 * - pending
 * - locked
 * - evicted
 *
 * The browser does NOT need to manually send an
 * Authorization header.
 *
 * Supabase authentication is read from the same
 * cookies used by the rest of the Uprix application.
 */
export async function GET(request: NextRequest) {
  /*
   * --------------------------------------------------
   * INITIAL RESPONSE
   * --------------------------------------------------
   *
   * Supabase may need to refresh authentication
   * cookies while processing this request.
   *
   * We therefore keep a response object that can
   * receive those updated cookies.
   */
  let supabaseResponse = NextResponse.next({
    request,
  });

  /*
   * --------------------------------------------------
   * CREATE SUPABASE SERVER CLIENT
   * --------------------------------------------------
   *
   * This is the same authentication pattern used
   * inside updateSession().
   *
   * The client reads the user's Supabase session
   * from the request cookies.
   */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        /*
         * Read authentication cookies from the
         * incoming request.
         */
        getAll() {
          return request.cookies.getAll();
        },

        /*
         * If Supabase refreshes the session, update
         * both the request and response cookies.
         */
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  try {
    /*
     * ------------------------------------------------
     * AUTHENTICATED USER
     * ------------------------------------------------
     *
     * getClaims() is the same authentication check
     * already being used by your proxy.
     *
     * This keeps the API and proxy consistent.
     */
    const { data, error } = await supabase.auth.getClaims();

    const user = data?.claims;

    /*
     * No valid authenticated user.
     */
    if (error || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
          headers: {
            /*
             * Prevent browsers/proxies from caching an
             * authentication-dependent response.
             */
            "Cache-Control": "no-store",
          },
        },
      );
    }

    /*
     * ------------------------------------------------
     * FIND RESULT ROOM PARTICIPANT
     * ------------------------------------------------
     *
     * Find the participant belonging to this
     * authenticated Supabase user.
     *
     * We use user.sub because getClaims() returns
     * the authenticated user's subject ID there.
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

    /*
     * ------------------------------------------------
     * DATABASE ERROR
     * ------------------------------------------------
     *
     * A database error is NOT the same thing as
     * "this user is not a participant".
     *
     * Therefore, don't return participant: null if
     * the query itself failed.
     */
    if (participantError) {
      console.error(
        "Error fetching Result Room participant:",
        participantError,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to determine Result Room participant status.",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    /*
     * ------------------------------------------------
     * NOT A RESULT ROOM PARTICIPANT
     * ------------------------------------------------
     *
     * The user can still be a completely valid Uprix
     * user without being registered for Result Room.
     *
     * Returning null lets the frontend distinguish
     * this from an API/database failure.
     */
    if (!participant) {
      return NextResponse.json(
        {
          success: true,
          participant: null,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    /*
     * ------------------------------------------------
     * SUCCESS
     * ------------------------------------------------
     *
     * Convert the database snake_case names into
     * camelCase names for the frontend.
     */
    return NextResponse.json(
      {
        success: true,

        participant: {
          id: participant.id,

          room_status: participant.room_status,

          isAdmin: participant.is_admin,

          adminRole: participant.admin_role,

          statusReason: participant.status_reason,

          statusChangedAt: participant.status_changed_at,
        },
      },
      {
        status: 200,

        headers: {
          /*
           * Participant status can change while the
           * user is using the application.
           *
           * We don't want an old API response cached.
           */
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    /*
     * ------------------------------------------------
     * UNEXPECTED SERVER ERROR
     * ------------------------------------------------
     */
    console.error("Unexpected error in Result Room participant API:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
