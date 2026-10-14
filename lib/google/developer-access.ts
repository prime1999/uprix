import "server-only";

type SupabaseClaims = {
  sub?: unknown;
  email?: unknown;
};

/**
 * Checks whether verified Supabase claims belong to
 * one of the two approved Uprix developers.
 *
 * Pass only claims returned by supabase.auth.getClaims().
 */
export function isAllowedGoogleDriveDeveloper(
  claims: SupabaseClaims | null | undefined,
): boolean {
  if (
    !claims ||
    typeof claims.sub !== "string" ||
    !claims.sub ||
    typeof claims.email !== "string" ||
    !claims.email
  ) {
    return false;
  }

  const configuredEmails =
    process.env.GOOGLE_DRIVE_ALLOWED_DEVELOPER_EMAILS ?? "";

  const allowedEmails = [
    ...new Set(
      configuredEmails
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  // Fail closed if the two expected developer accounts
  // haven't been configured correctly.
  if (allowedEmails.length !== 2) {
    return false;
  }

  return allowedEmails.includes(claims.email.trim().toLowerCase());
}
