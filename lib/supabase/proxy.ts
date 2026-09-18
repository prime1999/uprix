import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

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

  // Paystack webhook must be publicly accessible.
  // Paystack does not have a Supabase user session.
  if (request.nextUrl.pathname === "/api/result/webhook") {
    return supabaseResponse;
  }

  // Get the authenticated user.
  const { data, error } = await supabase.auth.getClaims();
  const user = data?.claims;

  const pathname = request.nextUrl.pathname;

  // Public routes.
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/admin");

  // If there is no authenticated user, send them to login
  // when they try to access a protected route.
  if (error || !user) {
    if (!isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";

      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  // User is authenticated.
  // Check whether they have completed their profile.
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("completed")
    .eq("user_id", user.sub)
    .maybeSingle();

  if (profileError) {
    console.error("Error checking user profile:", profileError);

    // Don't redirect based on an uncertain database result.
    return supabaseResponse;
  }

  const profileCompleted = profile?.completed === true;

  // --------------------------------------------------
  // LOGGED-IN USER VISITS LOGIN PAGE
  // --------------------------------------------------
  // If their profile is complete, send them home.
  // If their profile is incomplete, send them to profile creation.
  if (pathname === "/auth/login") {
    const url = request.nextUrl.clone();

    if (profileCompleted) {
      url.pathname = "/";
    } else {
      url.pathname = "/profile/create";
    }

    return NextResponse.redirect(url);
  }

  // --------------------------------------------------
  // INCOMPLETE PROFILE
  // --------------------------------------------------
  // Prevent users with incomplete profiles from accessing
  // normal protected pages.
  //
  // They are allowed to remain inside /auth and on the
  // profile creation page itself.
  if (
    !profileCompleted &&
    pathname !== "/profile/create" &&
    !pathname.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/profile/create";

    return NextResponse.redirect(url);
  }

  // User is authenticated and has completed their profile.
  return supabaseResponse;
}
