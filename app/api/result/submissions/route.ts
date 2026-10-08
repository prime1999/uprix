import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import { getDailySubmissionDeadline } from "@/lib/result-room/deadlines";

export async function POST(request: Request) {
  try {
    /**
     * ------------------------------------------------------------
     * 1. Create Supabase server client
     * ------------------------------------------------------------
     */

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
              /**
               * Cookie mutation can fail in some server
               * contexts where the response is already
               * being generated.
               *
               * Authentication itself is still handled
               * by getClaims().
               */
            }
          },
        },
      },
    );

    /**
     * ------------------------------------------------------------
     * 2. Authenticate the participant
     * ------------------------------------------------------------
     *
     * We use getClaims() because that is the authentication
     * pattern already used by the Result Room APIs.
     */

    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims?.sub) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const userId = claimsData.claims.sub;

    /**
     * ------------------------------------------------------------
     * 3. Get the participant
     * ------------------------------------------------------------
     */

    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select(
        `
        id,
        room_id,
        room_status
      `,
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error("Submission participant lookup error:", participantError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load participant.",
        },
        {
          status: 500,
        },
      );
    }

    if (!participant) {
      return NextResponse.json(
        {
          success: false,
          error: "Participant not found.",
        },
        {
          status: 404,
        },
      );
    }

    /**
     * ------------------------------------------------------------
     * 4. Participant must be active
     * ------------------------------------------------------------
     */

    if (participant.room_status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: "Only active participants can submit tasks.",
        },
        {
          status: 403,
        },
      );
    }

    /**
     * ------------------------------------------------------------
     * 5. Read the participant timezone
     * ------------------------------------------------------------
     *
     * The frontend sends the participant's IANA timezone.
     *
     * Example:
     *
     * Africa/Lagos
     * Europe/London
     * America/New_York
     *
     * We DO NOT accept the current time from the client.
     * The server creates the authoritative current Date.
     */

    let body: {
      timezone?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        {
          status: 400,
        },
      );
    }

    const timezone = body.timezone;

    if (typeof timezone !== "string" || timezone.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Participant timezone is required.",
        },
        {
          status: 400,
        },
      );
    }

    /**
     * ------------------------------------------------------------
     * 6. Validate the timezone
     * ------------------------------------------------------------
     *
     * Intl.DateTimeFormat will throw for an invalid IANA
     * timezone.
     *
     * We intentionally validate it on the server instead
     * of trusting the browser blindly.
     */

    try {
      new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
      });
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid participant timezone.",
        },
        {
          status: 400,
        },
      );
    }

    /**
     * ------------------------------------------------------------
     * 7. Check today's submission deadline
     * ------------------------------------------------------------
     *
     * IMPORTANT:
     *
     * new Date() is generated on the server.
     *
     * The client cannot tell the API:
     *
     * "It is 8:30 PM."
     *
     * The API decides the current instant itself.
     *
     * The timezone only determines what 9:00 PM means
     * for this participant.
     */

    const now = new Date();

    const submissionDeadline = getDailySubmissionDeadline(timezone, now);

    if (!submissionDeadline.isOpen) {
      return NextResponse.json(
        {
          success: false,
          error: "Today's task submission deadline has passed.",
          code: "SUBMISSION_DEADLINE_PASSED",
          deadline: submissionDeadline.deadline.toISOString(),
          localDate: submissionDeadline.localDate,
          timezone: submissionDeadline.timezone,
        },
        {
          status: 403,
        },
      );
    }

    /**
     * ------------------------------------------------------------
     * BUILD 1 PASSED
     * ------------------------------------------------------------
     *
     * We are deliberately stopping here.
     *
     * No submission has been created yet.
     * No Cloudinary record has been written.
     * No Google Drive upload has been attempted.
     *
     * This lets us test the authentication and deadline
     * layer independently before adding the next piece.
     */

    return NextResponse.json(
      {
        success: true,
        message: "Submission validation passed.",
        participantId: participant.id,
        roomId: participant.room_id,
        localDate: submissionDeadline.localDate,
        timezone: submissionDeadline.timezone,
        deadline: submissionDeadline.deadline.toISOString(),
        millisecondsRemaining: submissionDeadline.millisecondsRemaining,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Result Room submission API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error.",
      },
      {
        status: 500,
      },
    );
  }
}
