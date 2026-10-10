import "server-only";

import { google } from "googleapis";
import { Readable } from "node:stream";

const SCOPES = ["https://www.googleapis.com/auth/drive"];

function getDriveClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!clientEmail || !privateKey || !folderId) {
    throw new Error("Missing required Google Drive environment variables.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n"),
    },
    scopes: SCOPES,
  });

  return {
    drive: google.drive({ version: "v3", auth }),
    folderId,
  };
}

export interface GoogleDriveUploadInput {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export interface GoogleDriveUploadResult {
  fileId: string;
  webViewLink: string;
}

export async function uploadToGoogleDrive({
  fileName,
  mimeType,
  buffer,
}: GoogleDriveUploadInput): Promise<GoogleDriveUploadResult> {
  const { drive, folderId } = getDriveClient();

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: "id, webViewLink",
  });

  const fileId = response.data.id;
  const webViewLink = response.data.webViewLink;

  if (!fileId || !webViewLink) {
    throw new Error(
      "Google Drive uploaded the file but did not return its ID or viewing link.",
    );
  }

  return {
    fileId,
    webViewLink,
  };
}
