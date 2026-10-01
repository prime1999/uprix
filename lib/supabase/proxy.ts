import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  /*
   * --------------------------------------------------
   * INITIAL RESPONSE
   * --------------------------------------------------
   *
   * We create the response first because Supabase may
   * need to refresh authentication cookies during this
   * request.
   */
  let supabaseResponse = NextResponse.next({
    request,
  });

  /*
   * If the Supabase environment variables are not
   * configured, skip the middleware checks.
   */
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  /*
   * --------------------------------------------------
   * SUPABASE SERVER CLIENT
   * --------------------------------------------------
   *
   * A new Supabase server client is created for every
   * request.
   *
   * This is important when using Fluid Compute because
   * the client should not be stored globally.
   */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        /*
         * Read all cookies from the incoming request.
         */
        getAll() {
          return request.cookies.getAll();
        },

        /*
         * Supabase can refresh the user's auth cookies.
         *
         * We update both the request and response cookies
         * so the refreshed session is available throughout
         * the request lifecycle.
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

  /*
   * --------------------------------------------------
   * PAYSTACK WEBHOOK
   * --------------------------------------------------
   *
   * Paystack calls this endpoint directly.
   *
   * There is no Supabase user session when Paystack
   * sends the webhook, so we must allow the request
   * through without authentication.
   *
   * IMPORTANT:
   * The webhook route itself must still verify the
   * Paystack signature before processing payments.
   */
  if (request.nextUrl.pathname === "/api/result/webhook") {
    return supabaseResponse;
  }

  /*
   * --------------------------------------------------
   * REQUEST PATH
   * --------------------------------------------------
   */
  const pathname = request.nextUrl.pathname;

  /*
   * --------------------------------------------------
   * AUTHENTICATION
   * --------------------------------------------------
   *
   * Get the authenticated Supabase user.
   */
  const { data, error } = await supabase.auth.getClaims();
  const user = data?.claims;

  /*
   * --------------------------------------------------
   * PUBLIC ROUTES
   * --------------------------------------------------
   *
   * These routes can be accessed without authentication.
   *
   * IMPORTANT:
   * /result-room is intentionally NOT treated as a
   * protected Result Room route.
   *
   * The Result Room landing page is allowed to be viewed
   * by both authenticated and unauthenticated visitors.
   */
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/admin") ||
    pathname === "/result-room" ||
    pathname === "/result-room/";

  /*
   * --------------------------------------------------
   * NO AUTHENTICATED USER
   * --------------------------------------------------
   *
   * If there is no authenticated user, protected routes
   * redirect to the login page.
   *
   * The Result Room landing page remains accessible.
   */
  if (error || !user) {
    if (!isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";

      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  /*
   * --------------------------------------------------
   * USER PROFILE CHECK
   * --------------------------------------------------
   *
   * Every authenticated user must have completed their
   * main Uprix profile before accessing the rest of
   * the authenticated application.
   */
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("completed")
    .eq("user_id", user.sub)
    .maybeSingle();

  /*
   * If the database check fails, do not redirect the
   * user based on uncertain information.
   */
  if (profileError) {
    console.error("Error checking user profile:", profileError);

    return supabaseResponse;
  }

  const profileCompleted = profile?.completed === true;

  /*
   * --------------------------------------------------
   * LOGGED-IN USER VISITS LOGIN
   * --------------------------------------------------
   *
   * A user who is already authenticated should not
   * remain on the login page.
   */
  if (pathname === "/auth/login") {
    const url = request.nextUrl.clone();

    if (profileCompleted) {
      url.pathname = "/";
    } else {
      url.pathname = "/profile/create";
    }

    return NextResponse.redirect(url);
  }

  /*
   * --------------------------------------------------
   * INCOMPLETE PROFILE
   * --------------------------------------------------
   *
   * Users with incomplete profiles can access the
   * profile creation page and auth-related routes,
   * but cannot access the rest of the application.
   *
   * The Result Room landing page remains public.
   */
  if (
    !profileCompleted &&
    pathname !== "/profile/create" &&
    !pathname.startsWith("/auth") &&
    pathname !== "/result-room" &&
    pathname !== "/result-room/"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/profile/create";

    return NextResponse.redirect(url);
  }

  /*
   * --------------------------------------------------
   * RESULT ROOM DASHBOARD ROUTING
   * --------------------------------------------------
   *
   * IMPORTANT:
   *
   * We intentionally DO NOT check every /result-room
   * route here.
   *
   * /result-room is the public Result Room landing page.
   *
   * Participant authorization only starts when the user
   * enters:
   *
   *   /result-room/dashboard
   *
   * or one of its nested dashboard routes:
   *
   *   /result-room/dashboard/anything
   */
  const isResultRoomDashboardRoute =
    pathname === "/result-room/dashboard" ||
    pathname.startsWith("/result-room/dashboard/");

  if (isResultRoomDashboardRoute) {
    /*
     * ------------------------------------------------
     * FIND RESULT ROOM PARTICIPANT
     * ------------------------------------------------
     *
     * We look for the participant record belonging to
     * the currently authenticated Supabase user.
     *
     * This assumes:
     *
     * participants.user_id = auth.users.id
     */
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select(
        "id, room_status, is_admin, admin_role, status_reason, status_changed_at",
      )
      .eq("user_id", user.sub)
      .maybeSingle();

    /*
     * If the participant lookup fails, do not make an
     * authorization decision from incomplete information.
     */
    if (participantError) {
      console.error(
        "Error checking Result Room participant:",
        participantError,
      );

      return supabaseResponse;
    }

    /*
     * ------------------------------------------------
     * NOT A RESULT ROOM PARTICIPANT
     * ------------------------------------------------
     *
     * The user is a valid Uprix user, but they do not
     * have a Result Room participant record.
     *
     * They remain a normal Uprix user.
     */
    if (!participant) {
      const url = request.nextUrl.clone();
      url.pathname = "/";

      return NextResponse.redirect(url);
    }

    /*
     * ------------------------------------------------
     * RESULT ROOM ADMIN
     * ------------------------------------------------
     *
     * Admins have their own Result Room workspace.
     *
     * If an admin visits the participant dashboard,
     * send them to the admin dashboard instead.
     */
    if (participant.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/result-room/admin";

      return NextResponse.redirect(url);
    }

    /*
     * ------------------------------------------------
     * ACTIVE PARTICIPANT
     * ------------------------------------------------
     *
     * Active participants are allowed into the
     * Result Room participant workspace.
     */
    if (participant.room_status === "active") {
      return supabaseResponse;
    }

    /*
     * ------------------------------------------------
     * NON-ACTIVE PARTICIPANT
     * ------------------------------------------------
     *
     * Pending, locked, and evicted participants cannot
     * enter the normal Result Room dashboard.
     *
     * Instead, send them to the access page where we can
     * explain their current Result Room status.
     */
    const url = request.nextUrl.clone();
    url.pathname = "/result-room/access";

    return NextResponse.redirect(url);
  }

  /*
   * --------------------------------------------------
   * NORMAL UPRIX ROUTES
   * --------------------------------------------------
   *
   * If the request isn't the Result Room dashboard,
   * no Result Room participant-specific logic is applied.
   */
  return supabaseResponse;
}
