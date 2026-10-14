import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { isAllowedGoogleDriveDeveloper } from "./developer-access";

export class DeveloperAccessError extends Error {
  constructor(
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
    message: string,
  ) {
    super(message);
    this.name = "DeveloperAccessError";
  }
}

/**
 * Returns verified Supabase claims only when the current
 * request belongs to one of the approved Uprix developers.
 */
export async function requireGoogleDriveDeveloper() {
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
          // Server Components may not permit cookie mutation.
          // Middleware remains responsible for refreshing cookies.
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Safe to ignore when cookie mutation isn't available.
          }
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    throw new DeveloperAccessError(
      "UNAUTHENTICATED",
      "Sign in to Uprix to continue.",
    );
  }

  if (!isAllowedGoogleDriveDeveloper(data.claims)) {
    throw new DeveloperAccessError(
      "FORBIDDEN",
      "You are not allowed to manage the Google Drive integration.",
    );
  }

  return data.claims;
}
