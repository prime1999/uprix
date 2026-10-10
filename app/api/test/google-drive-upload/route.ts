import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { uploadToGoogleDrive } from "@/lib/google/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    // Authenticate the current user using their Supabase session.
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
              // Cookie updates may not be possible in every context.
            }
          },
        },
      },
    );

    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    // Confirm the authenticated user is a Result Room participant.
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, room_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error(
        "Google Drive test participant lookup failed:",
        participantError,
      );

      return NextResponse.json(
        { success: false, error: "Unable to verify participant." },
        { status: 500 },
      );
    }

    if (!participant) {
      return NextResponse.json(
        { success: false, error: "Result Room participant not found." },
        { status: 403 },
      );
    }

    if (participant.room_status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: "Only active participants can upload files.",
        },
        { status: 403 },
      );
    }

    // Read and validate the uploaded test image.
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Select an image to upload." },
        { status: 400 },
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Only JPEG, PNG, and WebP are allowed.",
        },
        { status: 400 },
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "Image must be smaller than 5 MB and not empty.",
        },
        { status: 400 },
      );
    }

    // Upload the image to the configured Google Drive folder.
    const result = await uploadToGoogleDrive({
      fileName: `drive-test-${Date.now()}-${file.name}`,
      mimeType: file.type,
      buffer: Buffer.from(await file.arrayBuffer()),
    });

    return NextResponse.json({
      success: true,
      message: "Image uploaded to Google Drive successfully.",
      file: result,
    });
  } catch (error) {
    console.error("Google Drive upload test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Google Drive upload failed. Check the server logs.",
      },
      { status: 500 },
    );
  }
}
