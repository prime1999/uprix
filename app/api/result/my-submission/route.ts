import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/result/my-submission?date=YYYY-MM-DD
 *
 * Returns the authenticated participant's own submission
 * and all images associated with that submission.
 *
 * The participant is resolved from the authenticated Supabase
 * session. The client cannot choose an arbitrary participant
 * or submission.
 */
export async function GET(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const json = (body: Record<string, unknown>, status = 200) => {
    const response = NextResponse.json(body, {
      status,
      headers: { "Cache-Control": "no-store" },
    });

    // Preserve refreshed Supabase session cookies.
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });

    return response;
  };

  try {
    console.log("My submission request received", {
      url: request.url,
      date: request.nextUrl.searchParams.get("date"),
    });

    // 1. Authenticate the current user.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const user = claimsData?.claims;

    if (claimsError || !user?.sub) {
      console.warn("My submission authentication failed", {
        error: claimsError?.message,
      });

      return json({ success: false, error: "Unauthorized." }, 401);
    }

    console.log("My submission authenticated", {
      userId: user.sub,
    });

    // 2. Validate the requested calendar date.
    const date = request.nextUrl.searchParams.get("date");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json(
        {
          success: false,
          error: "A valid date in YYYY-MM-DD format is required.",
        },
        400,
      );
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      return json({ success: false, error: "Invalid calendar date." }, 400);
    }

    console.log("My submission date validated", { date });

    // 3. Find the authenticated user's participant record.
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, room_status")
      .eq("user_id", user.sub)
      .maybeSingle();

    if (participantError) {
      console.error(
        "Error fetching my-submission participant:",
        participantError,
      );

      return json(
        { success: false, error: "Unable to load participant." },
        500,
      );
    }

    if (!participant) {
      return json({ success: false, error: "Participant not found." }, 404);
    }

    console.log("My submission participant resolved", {
      participantId: participant.id,
      roomStatus: participant.room_status,
    });

    if (participant.room_status !== "active") {
      return json(
        {
          success: false,
          error: "An active Result Room participant is required.",
        },
        403,
      );
    }

    // 4. Find this participant's submission for the requested day.
    // The participant ID comes exclusively from the authenticated
    // user's database record, never from client-supplied parameters.
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, description, submission_date, submitted_at, status")
      .eq("participant_id", participant.id)
      .eq("submission_date", date)
      .maybeSingle();

    if (submissionError) {
      console.error("Error fetching my submission:", submissionError);

      return json(
        {
          success: false,
          error: "Unable to load your submission.",
        },
        500,
      );
    }

    // No submission for the requested day is a normal state.
    if (!submission) {
      console.log("My submission not found for date", {
        participantId: participant.id,
        date,
      });

      return json({
        success: true,
        submission: null,
      });
    }

    console.log("My submission found", {
      submissionId: submission.id,
      participantId: participant.id,
      date,
    });

    // 5. Retrieve every image associated with this submission.
    const { data: files, error: filesError } = await supabase
      .from("submission_files")
      .select("id, cloudinary_url, created_at")
      .eq("submission_id", submission.id)
      .order("created_at", { ascending: true });

    if (filesError) {
      console.error("Error fetching my submission images:", filesError);

      return json(
        {
          success: false,
          error: "Unable to load submission images.",
        },
        500,
      );
    }

    // 6. Build the response in the format expected by the client.
    const images = (files ?? []).map((file) => ({
      id: file.id,
      url: file.cloudinary_url,
    }));

    console.log("My submission response built", {
      submissionId: submission.id,
      imageCount: images.length,
      date,
    });

    return json({
      success: true,
      submission: {
        id: submission.id,
        description: submission.description,
        submissionDate: submission.submission_date,
        submittedAt: submission.submitted_at,
        status: submission.status,
        images,
      },
    });
  } catch (error) {
    console.error("Unexpected error in my-submission API:", error);

    return json({ success: false, error: "Internal server error." }, 500);
  }
}
