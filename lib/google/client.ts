import "server-only";

import { createDecipheriv } from "node:crypto";
import { google, type drive_v3 } from "googleapis";

import { createAdminClient } from "@/lib/supabase/admin";

const CONNECTION_KEY = "result-room-evidence";
const REQUIRED_SCOPE = "https://www.googleapis.com/auth/drive.file";

type GoogleDriveConnectionRow = {
  storage_email: string;
  encrypted_refresh_token: string;
  encryption_iv: string;
  encryption_auth_tag: string;
  scopes: string[];
};

function decryptRefreshToken(input: {
  encryptedRefreshToken: string;
  encryptionIv: string;
  encryptionAuthTag: string;
}): string {
  const encodedKey = process.env.GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY;

  if (!encodedKey) {
    throw new Error("Google OAuth encryption key is not configured.");
  }

  const key = Buffer.from(encodedKey, "base64");

  if (key.length !== 32) {
    throw new Error("Google OAuth encryption key must be 32 bytes.");
  }

  const iv = Buffer.from(input.encryptionIv, "base64");
  const authTag = Buffer.from(input.encryptionAuthTag, "base64");
  const encrypted = Buffer.from(input.encryptedRefreshToken, "base64");

  if (iv.length !== 12 || authTag.length !== 16) {
    throw new Error("Stored Google OAuth token data is invalid.");
  }

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export interface GoogleDriveClient {
  drive: drive_v3.Drive;
  folderId: string;
  storageEmail: string;
}

/**
 * Creates an authenticated Google Drive client using the server-side
 * OAuth connection stored in Supabase.
 *
 * Never call this from browser code or return its credentials to a client.
 */
export async function getGoogleDriveClient(): Promise<GoogleDriveClient> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  const expectedEmail = process.env.GOOGLE_DRIVE_STORAGE_EMAIL;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (
    !clientId ||
    !clientSecret ||
    !redirectUri ||
    !expectedEmail ||
    !folderId
  ) {
    throw new Error("Google Drive environment configuration is incomplete.");
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("google_drive_connections")
    .select(
      [
        "storage_email",
        "encrypted_refresh_token",
        "encryption_iv",
        "encryption_auth_tag",
        "scopes",
      ].join(", "),
    )
    .eq("connection_key", CONNECTION_KEY)
    .maybeSingle();

  if (error) {
    throw new Error("Could not read the Google Drive connection.");
  }

  const connection = data as GoogleDriveConnectionRow | null;

  if (!connection) {
    throw new Error("Google Drive has not been connected yet.");
  }

  if (!connection) {
    throw new Error("Google Drive has not been connected yet.");
  }

  if (
    connection.storage_email.trim().toLowerCase() !==
    expectedEmail.trim().toLowerCase()
  ) {
    throw new Error(
      "Stored Google Drive account does not match configuration.",
    );
  }

  if (
    !Array.isArray(connection.scopes) ||
    !connection.scopes.includes(REQUIRED_SCOPE)
  ) {
    throw new Error(
      "The Google Drive connection is missing the required scope.",
    );
  }

  const refreshToken = decryptRefreshToken({
    encryptedRefreshToken: connection.encrypted_refresh_token,
    encryptionIv: connection.encryption_iv,
    encryptionAuthTag: connection.encryption_auth_tag,
  });

  const oauthClient = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri,
  );

  oauthClient.setCredentials({
    refresh_token: refreshToken,
  });

  return {
    drive: google.drive({
      version: "v3",
      auth: oauthClient,
    }),
    folderId,
    storageEmail: connection.storage_email,
  };
}
