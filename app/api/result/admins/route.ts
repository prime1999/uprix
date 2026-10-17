import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    console.log("[Result admins] GET request started");

    // 1. Authenticate the request using the user's session.
    const supabase = await createClient();

    const supabaseAdmin = createAdminClient();

    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      console.warn("[Result admins] Authentication failed", {
        hasClaimsError: Boolean(claimsError),
        hasUserId: Boolean(userId),
      });

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Result admins] User authenticated", {
      hasUserId: true,
    });

    // 2. Fetch admin participants using the server-only admin client.
    const { data: participants, error: participantsError } = await supabaseAdmin
      .from("participants")
      .select("id, user_id, phone, admin_role")
      .eq("is_admin", true)
      .not("user_id", "is", null)
      .order("admin_role", { ascending: true });

    if (participantsError) {
      console.error("[Result admins] Failed to fetch admin participants", {
        code: participantsError.code,
        message: participantsError.message,
      });

      return NextResponse.json(
        { error: "Failed to fetch admins" },
        { status: 500 },
      );
    }

    console.log("[Result admins] Admin participants loaded", {
      count: participants?.length ?? 0,
    });

    if (!participants?.length) {
      console.log("[Result admins] No admins found");

      return NextResponse.json(
        { admins: [], total: 0 },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, no-store",
          },
        },
      );
    }

    // 3. Collect unique user IDs for the profile lookup.
    const userIds = [
      ...new Set(
        participants
          .map((participant: any) => participant.user_id)
          .filter((id: any): id is string => Boolean(id)),
      ),
    ];

    console.log("[Result admins] Fetching admin profiles", {
      participantCount: participants.length,
      uniqueUserCount: userIds.length,
    });

    // 4. Fetch only the profile fields needed by this endpoint.
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("user_profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", userIds);

    if (profilesError) {
      console.error("[Result admins] Failed to fetch admin profiles", {
        code: profilesError.code,
        message: profilesError.message,
      });

      return NextResponse.json(
        { error: "Failed to fetch admin profiles" },
        { status: 500 },
      );
    }

    // 5. Index profiles by user ID for efficient matching.
    const profilesByUserId = new Map(
      (profiles ?? []).map((profile: any) => [profile.user_id, profile]),
    );

    // 6. Combine participant and profile information.
    const admins = participants.map((participant: any) => {
      const profile = participant.user_id
        ? profilesByUserId.get(participant.user_id)
        : undefined;

      return {
        id: participant.id,
        user_id: participant.user_id,
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        phone: participant.phone ?? null,
        admin_role: participant.admin_role ?? null,
      };
    });

    console.log("[Result admins] Returning admins response", {
      adminCount: admins.length,
      profileCount: profiles?.length ?? 0,
    });

    // 7. Return the directory without caching sensitive data.
    return NextResponse.json(
      {
        admins,
        total: admins.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("[Result admins] Unexpected error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
