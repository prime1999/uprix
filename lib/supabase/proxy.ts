import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { hasEnvVars } from "@/lib/utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;

  /*
   * ---------------------------------------------------------
   * PUBLIC ROUTES
   * ---------------------------------------------------------
   *
   * /result-room-2 is public.
   *
   * /result-room is intentionally NOT public.
   */
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/admin") ||
    pathname === "/result-room-2" ||
    pathname === "/result-room-2/";

  /*
   * ---------------------------------------------------------
   * PAYSTACK WEBHOOK
   * ---------------------------------------------------------
   *
   * Paystack webhook must be accessible without
   * authentication.
   */
  const isPaystackWebhook = pathname === "/api/result/webhook";

  if (isPaystackWebhook) {
    return supabaseResponse;
  }

  /*
   * ---------------------------------------------------------
   * AUTHENTICATION
   * ---------------------------------------------------------
   */

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  /*
   * Unauthenticated users can only access public routes.
   *
   * Notice that /result-room is NOT public.
   */
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();

    url.pathname = "/auth/login";

    return NextResponse.redirect(url);
  }

  /*
   * If there is no authenticated user and this is a
   * public route, allow the request to continue.
   *
   * This is what allows /result-room-2 to be accessed
   * without authentication.
   */
  if (!user) {
    return supabaseResponse;
  }

  /*
   * ---------------------------------------------------------
   * USER PROFILE
   * ---------------------------------------------------------
   */

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("completed")
    .eq("id", user.sub)
    .maybeSingle();

  if (profileError) {
    console.error("Middleware profile lookup error:", profileError);

    return supabaseResponse;
  }

  const profileCompleted = profile?.completed === true;

  /*
   * ---------------------------------------------------------
   * PROFILE COMPLETION GATE
   * ---------------------------------------------------------
   *
   * Incomplete profiles can access:
   *
   * - /auth/*
   * - /profile/create
   * - /result-room-2
   *
   * They cannot access /result-room until
   * their profile is complete.
   */
  if (
    !profileCompleted &&
    pathname !== "/profile/create" &&
    !pathname.startsWith("/auth") &&
    pathname !== "/result-room-2" &&
    pathname !== "/result-room-2/"
  ) {
    const url = request.nextUrl.clone();

    url.pathname = "/profile/create";

    return NextResponse.redirect(url);
  }

  /*
   * ---------------------------------------------------------
   * AUTHENTICATED USER VISITING LOGIN
   * ---------------------------------------------------------
   */

  if (pathname === "/auth/login" || pathname === "/login") {
    const url = request.nextUrl.clone();

    if (profileCompleted) {
      url.pathname = "/";
    } else {
      url.pathname = "/profile/create";
    }

    return NextResponse.redirect(url);
  }

  /*
   * ---------------------------------------------------------
   * RESULT ROOM DASHBOARD
   * ---------------------------------------------------------
   *
   * Requires:
   *
   * 1. Authentication
   * 2. Completed profile
   * 3. Participant record
   * 4. Active room_status
   */
  const isResultRoomDashboardRoute =
    pathname === "/result-room/dashboard" ||
    pathname.startsWith("/result-room/dashboard/");

  if (isResultRoomDashboardRoute) {
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select(
        "id, room_status, is_admin, admin_role, status_reason, status_changed_at",
      )
      .eq("user_id", user.sub)
      .maybeSingle();

    if (participantError) {
      console.error("Middleware participant lookup error:", participantError);

      return supabaseResponse;
    }

    /*
     * Authenticated user without a participant record
     * cannot access the Result Room dashboard.
     */
    if (!participant) {
      const url = request.nextUrl.clone();

      url.pathname = "/";

      return NextResponse.redirect(url);
    }

    /*
     * Admins use the admin dashboard.
     */
    if (participant.is_admin) {
      const url = request.nextUrl.clone();

      url.pathname = "/result-room/admin";

      return NextResponse.redirect(url);
    }

    /*
     * Only active participants can access the
     * participant dashboard.
     */
    if (participant.room_status === "active") {
      return supabaseResponse;
    }

    /*
     * Pending, locked, evicted, etc.
     * remain authenticated but cannot enter the dashboard.
     */
    const url = request.nextUrl.clone();

    url.pathname = "/result-room/access";

    return NextResponse.redirect(url);
  }

  /*
   * ---------------------------------------------------------
   * ALL OTHER ROUTES
   * ---------------------------------------------------------
   */

  return supabaseResponse;
}
