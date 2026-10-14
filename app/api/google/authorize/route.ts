import "server-only";

import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import {
  DeveloperAccessError,
  requireGoogleDriveDeveloper,
} from "@/lib/google/require-developer";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive",
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
];

export async function GET() {
  // 1. Only approved Uprix developers can start OAuth.
  try {
    await requireGoogleDriveDeveloper();
  } catch (error) {
    if (error instanceof DeveloperAccessError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : 403;

      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("Google Drive developer access check failed.");

    return NextResponse.json(
      { error: "Unable to verify developer access." },
      { status: 500 },
    );
  }

  // 2. Validate the required environment variables.
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  const storageEmail = process.env.GOOGLE_DRIVE_STORAGE_EMAIL;

  if (!clientId || !redirectUri || !storageEmail) {
    return NextResponse.json(
      { error: "Google OAuth configuration is incomplete." },
      { status: 500 },
    );
  }

  // 3. Generate a cryptographically secure OAuth state value.
  const state = randomBytes(32).toString("base64url");

  // 4. Build Google's authorization URL.
  const authorizationUrl = new URL(GOOGLE_AUTH_URL);

  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("access_type", "offline");
  authorizationUrl.searchParams.set("prompt", "consent");
  authorizationUrl.searchParams.set("login_hint", storageEmail);
  authorizationUrl.searchParams.set("include_granted_scopes", "true");

  // 5. Redirect to Google and store state in a short-lived cookie.
  const response = NextResponse.redirect(authorizationUrl);

  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/google/callback",
    maxAge: 10 * 60,
  });

  return response;
}
