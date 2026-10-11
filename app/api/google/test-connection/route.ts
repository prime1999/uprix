import "server-only";

import { NextResponse } from "next/server";

import {
  DeveloperAccessError,
  requireGoogleDriveDeveloper,
} from "@/lib/google/require-developer";
import { getGoogleDriveClient } from "@/lib/google/client";

export async function GET() {
  try {
    await requireGoogleDriveDeveloper();
  } catch (error) {
    if (error instanceof DeveloperAccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "UNAUTHENTICATED" ? 401 : 403 },
      );
    }

    console.error("Google Drive test access check failed.");

    return NextResponse.json(
      { error: "Unable to verify developer access." },
      { status: 500 },
    );
  }

  try {
    const { drive, folderId, storageEmail } = await getGoogleDriveClient();

    const { data: folder } = await drive.files.get({
      fileId: folderId,
      fields: "id,name,mimeType,mimeType,capabilities(canAddChildren),trashed",
      supportsAllDrives: true,
    });

    if (folder.trashed) {
      return NextResponse.json(
        { error: "The configured Google Drive folder is in the trash." },
        { status: 409 },
      );
    }

    if (folder.mimeType !== "application/vnd.google-apps.folder") {
      return NextResponse.json(
        { error: "GOOGLE_DRIVE_FOLDER_ID does not identify a folder." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      storageEmail,
      folder: {
        id: folder.id,
        name: folder.name,
      },
      canAddFiles: folder.capabilities?.canAddChildren === true,
    });
  } catch (error: unknown) {
    // Log only safe diagnostic details. Never log tokens or secrets.
    if (error && typeof error === "object") {
      const apiError = error as {
        message?: unknown;
        code?: unknown;
        response?: {
          status?: unknown;
          data?: {
            error?: {
              message?: unknown;
              status?: unknown;
              errors?: Array<{ reason?: unknown }>;
            };
          };
        };
      };

      console.error("Google Drive folder test diagnostic:", {
        message:
          typeof apiError.message === "string"
            ? apiError.message
            : "Unknown error",
        code: apiError.code,
        httpStatus: apiError.response?.status,
        googleStatus: apiError.response?.data?.error?.status,
        googleMessage: apiError.response?.data?.error?.message,
        reasons: apiError.response?.data?.error?.errors?.map(
          (item) => item.reason,
        ),
      });
    } else {
      console.error("Google Drive folder test failed with an unknown error.");
    }

    return NextResponse.json(
      {
        error:
          "Could not access the configured Google Drive folder. Check the server logs for diagnostic details.",
      },
      { status: 502 },
    );
  }
}
