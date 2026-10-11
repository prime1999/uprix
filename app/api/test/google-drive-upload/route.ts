import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { uploadToGoogleDrive } from "@/lib/google/drive-upload-client";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getLagosDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the current user with their Supabase session.
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
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Cookie updates may not be available in every context.
            }
          },
        },
      },
    );

    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (claimsError || typeof userId !== "string" || !userId) {
      return jsonError("Authentication required.", 401);
    }

    // Resolve the participant using the authenticated user's ID.
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, room_status, seat_number")
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error(
        "Google Drive test participant lookup failed:",
        participantError.message,
      );

      return jsonError("Unable to verify participant.", 500);
    }

    if (!participant) {
      return jsonError("Result Room participant not found.", 403);
    }

    if (participant.room_status !== "active") {
      return jsonError("Only active participants can upload files.", 403);
    }

    // Validate the test image.
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("Select an image to upload.", 400);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError("Only JPEG, PNG, and WebP images are allowed.", 400);
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return jsonError(
        "Image must be larger than 0 bytes and no larger than 5 MB.",
        400,
      );
    }

    // Sanitize the original filename for the test upload.
    const timestamp = Date.now();

    const originalName = file.name
      .replace(/[\\/]/g, "_")
      .replace(/[\u0000-\u001F\u007F]/g, "_")
      .slice(0, 120);

    // Use the seat number from Supabase.
    // The uploader handles null by using "participant-no-seat".
    const result = await uploadToGoogleDrive({
      fileName: `TEST-drive-test-${timestamp}-${originalName}`,
      mimeType: file.type,
      buffer: Buffer.from(await file.arrayBuffer()),
      participantSeatNumber: participant.seat_number ?? null,
      evidenceDate: getLagosDate(),
    });

    return NextResponse.json({
      success: true,
      message:
        "Google Drive test upload succeeded. This is not a real submission.",
      file: result,
    });
  } catch (error) {
    // Keep internal errors and credentials out of the response.
    console.error(
      "Google Drive upload test failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return jsonError(
      "Google Drive upload failed. Check the server configuration and logs.",
      500,
    );
  }
}
