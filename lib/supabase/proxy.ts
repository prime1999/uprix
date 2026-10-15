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

  // ---------------------------------------------------------
  // PUBLIC ROUTES
  // ---------------------------------------------------------
  // Result Room routes are NOT public.
  // Users must authenticate before accessing them.

  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/admin");

  // ---------------------------------------------------------
  // PAYSTACK WEBHOOK
  // ---------------------------------------------------------
  // Paystack must be able to call the webhook without a
  // browser authentication session. Signature verification
  // is handled inside the webhook route itself.

  const isPaystackWebhook = pathname === "/api/result/webhook";

  if (isPaystackWebhook) {
    return supabaseResponse;
  }

  // ---------------------------------------------------------
  // AUTHENTICATION
  // ---------------------------------------------------------

  const { data, error: claimsError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (claimsError) {
    console.error("Middleware authentication error:", claimsError);
  }

  // Unauthenticated users can only access public routes.
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";

    return NextResponse.redirect(url);
  }

  // Allow unauthenticated users to continue on public routes.
  if (!user) {
    return supabaseResponse;
  }

  // ---------------------------------------------------------
  // USER PROFILE
  // ---------------------------------------------------------

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("completed")
    .eq("user_id", user.sub)
    .maybeSingle();

  if (profileError) {
    console.error("Middleware profile lookup error:", profileError);

    return supabaseResponse;
  }

  const profileCompleted = profile?.completed === true;

  // ---------------------------------------------------------
  // PROFILE COMPLETION GATE
  // ---------------------------------------------------------
  // Incomplete profiles can access:
  // - /auth/*
  // - /profile/create
  //
  // All other protected routes require a completed profile.

  if (
    !profileCompleted &&
    pathname !== "/profile/create" &&
    !pathname.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/profile/create";

    return NextResponse.redirect(url);
  }

  // ---------------------------------------------------------
  // AUTHENTICATED USER VISITING LOGIN
  // ---------------------------------------------------------

  if (pathname === "/auth/login" || pathname === "/login") {
    const url = request.nextUrl.clone();

    url.pathname = profileCompleted ? "/" : "/profile/create";

    return NextResponse.redirect(url);
  }

  // ---------------------------------------------------------
  // RESULT ROOM DASHBOARD
  // ---------------------------------------------------------
  // Requires:
  // 1. Authentication
  // 2. Completed profile
  // 3. Participant record
  // 4. Active room_status for regular participants

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

    // Users without a participant record cannot access
    // the Result Room dashboard.
    if (!participant) {
      const url = request.nextUrl.clone();
      url.pathname = "/";

      return NextResponse.redirect(url);
    }

    // Admins use the admin dashboard.
    if (participant.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/result-room/admin";

      return NextResponse.redirect(url);
    }

    // Only active participants can access the dashboard.
    if (participant.room_status === "active") {
      return supabaseResponse;
    }

    // Pending, locked, evicted, and other statuses
    // are redirected to the access page.
    const url = request.nextUrl.clone();
    url.pathname = "/result-room/access";

    return NextResponse.redirect(url);
  }

  // ---------------------------------------------------------
  // ALL OTHER ROUTES
  // ---------------------------------------------------------

  return supabaseResponse;
}
