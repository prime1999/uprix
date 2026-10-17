import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PROFILE_FIELDS = [
  "full_name",
  "avatar_url",
  "goal",
  "phone",
  "email",
] as const;

type ProfileField = (typeof PROFILE_FIELDS)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate the current user.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 2. Parse the request body.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Request body must be a JSON object." },
        { status: 400 },
      );
    }

    const fields = Object.keys(body);

    if (fields.length === 0) {
      return NextResponse.json(
        { error: "Provide at least one field to update." },
        { status: 400 },
      );
    }

    // 3. Reject fields this endpoint does not support.
    const unsupportedField = fields.find(
      (field) => !PROFILE_FIELDS.includes(field as ProfileField),
    );

    if (unsupportedField) {
      return NextResponse.json(
        { error: `Unsupported field: ${unsupportedField}` },
        { status: 400 },
      );
    }

    // 4. Validate field values.
    for (const field of fields) {
      const value = body[field];

      if (value !== null && typeof value !== "string") {
        return NextResponse.json(
          { error: `${field} must be a string or null.` },
          { status: 400 },
        );
      }

      if (typeof value === "string" && value.trim() === "") {
        return NextResponse.json(
          { error: `${field} cannot be empty.` },
          { status: 400 },
        );
      }

      if (typeof value === "string" && value.length > 2000) {
        return NextResponse.json(
          { error: `${field} is too long.` },
          { status: 400 },
        );
      }
    }

    // 5. Validate email format when supplied.
    if (
      typeof body.email === "string" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
    ) {
      return NextResponse.json(
        { error: "Provide a valid email address." },
        { status: 400 },
      );
    }

    // Primary goal is limited to 70 characters.
    if (typeof body.goal === "string" && body.goal.trim().length > 70) {
      return NextResponse.json(
        { error: "Primary goal must be 70 characters or fewer." },
        { status: 400 },
      );
    }

    // 6. Validate avatar_url.
    // Accept either an avatar identifier or a valid HTTP/HTTPS URL.
    if (typeof body.avatar_url === "string") {
      const avatarValue = body.avatar_url.trim();

      if (avatarValue !== body.avatar_url) {
        return NextResponse.json(
          { error: "avatar_url cannot contain surrounding whitespace." },
          { status: 400 },
        );
      }

      // Accept simple avatar identifiers such as male-1 or female-1.
      const isAvatarIdentifier = /^[a-zA-Z0-9_-]+$/.test(avatarValue);

      // Otherwise, require a valid HTTP/HTTPS URL.
      if (!isAvatarIdentifier) {
        try {
          const avatarUrl = new URL(avatarValue);

          if (
            (avatarUrl.protocol !== "https:" &&
              avatarUrl.protocol !== "http:") ||
            !avatarUrl.hostname
          ) {
            throw new Error("Unsupported URL");
          }
        } catch {
          return NextResponse.json(
            {
              error:
                "avatar_url must be a valid avatar identifier or HTTP/HTTPS URL.",
            },
            { status: 400 },
          );
        }
      }
    }

    // 7. Update all supplied fields atomically.
    const { data, error } = await supabase.rpc("update_my_profile", {
      p_updates: body,
    });

    if (error) {
      console.error("Profile update failed:", {
        userId,
        code: error.code,
        message: error.message,
      });

      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }

      if (
        error.message.includes("Unsupported profile field") ||
        error.message.includes("Provide at least one field")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (
        error.message.includes("User profile not found") ||
        error.code === "P0002" ||
        error.code === "P0003"
      ) {
        return NextResponse.json(
          {
            error:
              "A required profile or participant record was not found, or the account has multiple participant records.",
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Failed to update your profile." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully.",
      ...data,
    });
  } catch (error) {
    console.error("Profile API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
