import "server-only";

import { createCipheriv, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

import {
  DeveloperAccessError,
  requireGoogleDriveDeveloper,
} from "@/lib/google/require-developer";
import { createAdminClient } from "@/lib/supabase/admin";

const STATE_COOKIE = "google_oauth_state";
const CONNECTION_KEY = "result-room-evidence";

function encryptRefreshToken(refreshToken: string) {
  const encodedKey = process.env.GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY;

  if (!encodedKey) {
    throw new Error("OAuth encryption key is not configured.");
  }

  const key = Buffer.from(encodedKey, "base64");

  if (key.length !== 32) {
    throw new Error("OAuth encryption key must decode to 32 bytes.");
  }

  // AES-256-GCM encrypts the token and detects tampering.
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(refreshToken, "utf8"),
    cipher.final(),
  ]);

  return {
    encryptedRefreshToken: encrypted.toString("base64"),
    encryptionIv: iv.toString("base64"),
    encryptionAuthTag: cipher.getAuthTag().toString("base64"),
  };
}

function responseWithClearedState(body: { error: string }, status: number) {
  const response = NextResponse.json(body, { status });

  response.cookies.set(STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/google/callback",
    maxAge: 0,
  });

  return response;
}

export async function GET(request: NextRequest) {
  // 1. Verify that this callback belongs to an approved developer.
  try {
    await requireGoogleDriveDeveloper();
  } catch (error) {
    if (error instanceof DeveloperAccessError) {
      return responseWithClearedState(
        { error: error.message },
        error.code === "UNAUTHENTICATED" ? 401 : 403,
      );
    }

    console.error("Google Drive callback access check failed.");

    return responseWithClearedState(
      { error: "Unable to verify developer access." },
      500,
    );
  }

  // 2. Validate OAuth state to prevent forged callbacks.
  const query = request.nextUrl.searchParams;
  const returnedState = query.get("state");
  const savedState = request.cookies.get(STATE_COOKIE)?.value;

  if (
    !returnedState ||
    !savedState ||
    returnedState.length !== savedState.length ||
    returnedState !== savedState
  ) {
    return responseWithClearedState(
      { error: "Invalid or expired OAuth state. Start again." },
      400,
    );
  }

  // 3. Handle authorization cancellation or denial.
  const providerError = query.get("error");

  if (providerError) {
    return responseWithClearedState(
      { error: "Google Drive authorization was not completed." },
      400,
    );
  }

  const code = query.get("code");

  if (!code) {
    return responseWithClearedState(
      { error: "Google did not return an authorization code." },
      400,
    );
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  const storageEmail = process.env.GOOGLE_DRIVE_STORAGE_EMAIL;

  if (!clientId || !clientSecret || !redirectUri || !storageEmail) {
    return responseWithClearedState(
      { error: "Google OAuth configuration is incomplete." },
      500,
    );
  }

  try {
    // 4. Exchange the one-time authorization code for tokens.
    const oauthClient = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );

    const { tokens } = await oauthClient.getToken(code);

    if (!tokens.refresh_token) {
      return responseWithClearedState(
        {
          error:
            "Google did not return a refresh token. Revoke this app's access in the Google Account, then start authorization again.",
        },
        400,
      );
    }

    // 5. Verify the identity of the Google account that authorized.
    oauthClient.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauthClient,
      version: "v2",
    });

    const { data: googleAccount } = await oauth2.userinfo.get();

    const actualEmail = googleAccount.email?.trim().toLowerCase();
    const expectedEmail = storageEmail.trim().toLowerCase();

    if (
      !actualEmail ||
      googleAccount.verified_email !== true ||
      actualEmail !== expectedEmail
    ) {
      return responseWithClearedState(
        {
          error:
            "The connected Google account does not match GOOGLE_DRIVE_STORAGE_EMAIL, or its email is not verified.",
        },
        403,
      );
    }

    // 6. Encrypt the refresh token before saving it.
    const encrypted = encryptRefreshToken(tokens.refresh_token);

    const scopes = (tokens.scope ?? "").split(/\s+/).filter(Boolean);

    if (
      !scopes.includes("https://www.googleapis.com/auth/drive.file") ||
      !scopes.includes("openid") ||
      !scopes.includes("https://www.googleapis.com/auth/userinfo.email")
    ) {
      return responseWithClearedState(
        { error: "Google did not grant all required OAuth scopes." },
        400,
      );
    }

    // 7. Save the encrypted connection using the server-only admin client.
    const supabase = createAdminClient();

    const { error: databaseError } = await supabase
      .from("google_drive_connections")
      .upsert(
        {
          connection_key: CONNECTION_KEY,
          storage_email: actualEmail,
          encrypted_refresh_token: encrypted.encryptedRefreshToken,
          encryption_iv: encrypted.encryptionIv,
          encryption_auth_tag: encrypted.encryptionAuthTag,
          scopes,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "connection_key" },
      );

    if (databaseError) {
      console.error("Failed to save Google Drive connection.");

      return responseWithClearedState(
        { error: "Could not save the Google Drive connection." },
        500,
      );
    }

    // 8. Report success without returning any tokens to the browser.
    const response = NextResponse.json({
      success: true,
      message: "Google Drive is connected.",
      connectedAccount: actualEmail,
    });

    response.cookies.set(STATE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/google/callback",
      maxAge: 0,
    });

    return response;
  } catch {
    // Never log OAuth tokens, authorization codes, or secrets.
    console.error("Google Drive OAuth callback failed.");

    return responseWithClearedState(
      { error: "Google Drive authorization failed. Please try again." },
      500,
    );
  }
}
