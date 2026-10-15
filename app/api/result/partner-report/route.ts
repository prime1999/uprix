import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function createSupabaseServerClient(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  return createServerClient(
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
            // Cookie mutation may not be available in this context.
          }
        },
      },
    },
  );
}

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Return the calendar date in the supplied timezone.
 */
function getDateInTimezone(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

/**
 * Validate an actual YYYY-MM-DD calendar date.
 *
 * This validation does not depend on the server's local timezone.
 */
function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Convert a local wall-clock date and time in an IANA timezone
 * into an absolute timestamp.
 *
 * Used for the 9:30 PM reporting deadline. This avoids using
 * setHours(), which would use the server's timezone.
 */
function getZonedDateTime(
  dateString: string,
  hour: number,
  minute: number,
  timezone: string,
): Date {
  const [year, month, day] = dateString.split("-").map(Number);

  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);

  let guess = targetAsUtc;

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  // Reconcile the requested local wall-clock time with its
  // corresponding absolute timestamp.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = formatter.formatToParts(new Date(guess));

    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );

    const representedAsUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );

    const difference = targetAsUtc - representedAsUtc;

    if (difference === 0) {
      break;
    }

    guess += difference;
  }

  return new Date(guess);
}

export async function POST(request: Request) {
  try {
    /**
     * 1. Read and validate the browser's timezone.
     *
     * The frontend must send the x-time-zone header.
     */
    const timezone = request.headers.get("x-time-zone");

    if (!timezone || !isValidTimezone(timezone)) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid browser timezone is required.",
          code: "INVALID_TIMEZONE",
        },
        {
          status: 400,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    /**
     * 2. Authenticate the participant.
     */
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const user = claimsData?.claims;

    if (claimsError || !user?.sub) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        {
          status: 401,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    /**
     * 3. Find the participant.
     */
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, room_id, room_status")
      .eq("user_id", user.sub)
      .maybeSingle();

    if (participantError) {
      console.error(
        "Partner report participant lookup failed:",
        participantError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Could not verify participant.",
        },
        {
          status: 500,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    if (!participant) {
      return NextResponse.json(
        { success: false, message: "Participant not found." },
        {
          status: 404,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    if (participant.room_status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Your participation is not active.",
        },
        {
          status: 403,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    /**
     * 4. Parse and validate the request body.
     */
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        {
          status: 400,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        {
          status: 400,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    const payload = body as {
      date?: unknown;
      comment?: unknown;
      submittedOnTime?: unknown;
    };

    if (typeof payload.date !== "string" || !isValidDateString(payload.date)) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid reporting date is required.",
        },
        {
          status: 400,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    if (typeof payload.submittedOnTime !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please confirm whether your partner submitted their task on time.",
        },
        {
          status: 400,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    /**
     * 5. Validate the optional comment.
     */
    let comment: string | null = null;

    if (payload.comment !== undefined && payload.comment !== null) {
      if (typeof payload.comment !== "string") {
        return NextResponse.json(
          { success: false, message: "Comment must be text." },
          {
            status: 400,
            headers: { "Cache-Control": "private, no-store" },
          },
        );
      }

      comment = payload.comment.trim() || null;

      if (comment && comment.length > 2000) {
        return NextResponse.json(
          {
            success: false,
            message: "Comment cannot exceed 2000 characters.",
          },
          {
            status: 400,
            headers: { "Cache-Control": "private, no-store" },
          },
        );
      }
    }

    /**
     * 6. Validate today's reporting date in the participant's timezone.
     */
    const now = new Date();
    const todayString = getDateInTimezone(now, timezone);

    if (payload.date !== todayString) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only submit a partner report for today.",
          today: todayString,
          timezone,
        },
        {
          status: 400,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    /**
     * Partner reporting closes at 9:30 PM in the participant's
     * browser/device timezone.
     */
    const deadline = getZonedDateTime(todayString, 21, 30, timezone);

    if (now.getTime() >= deadline.getTime()) {
      return NextResponse.json(
        {
          success: false,
          message: "Partner reporting is closed for today.",
          deadline: deadline.toISOString(),
          timezone,
        },
        {
          status: 403,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    /**
     * 7. Find the participant's active partner pair.
     */
    const { data: activePair, error: pairError } = await supabase
      .from("partner_pairs")
      .select("id, participant_a_id, participant_b_id")
      .eq("room_id", participant.room_id)
      .eq("status", "ACTIVE")
      .or(
        `participant_a_id.eq.${participant.id},participant_b_id.eq.${participant.id}`,
      )
      .maybeSingle();

    if (pairError) {
      console.error("Partner report pair lookup failed:", pairError);

      return NextResponse.json(
        { success: false, message: "Could not find your partner." },
        {
          status: 500,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    if (!activePair) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have an active partner pair.",
        },
        {
          status: 404,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    const partnerId =
      activePair.participant_a_id === participant.id
        ? activePair.participant_b_id
        : activePair.participant_a_id;

    /**
     * 8. Prevent duplicate reports for the same pair and date.
     */
    const { data: existingReport, error: existingReportError } = await supabase
      .from("partner_reviews")
      .select("id")
      .eq("partner_pair_id", activePair.id)
      .eq("reviewer_id", participant.id)
      .eq("partner_id", partnerId)
      .eq("review_date", todayString)
      .maybeSingle();

    if (existingReportError) {
      console.error(
        "Partner report duplicate check failed:",
        existingReportError,
      );

      return NextResponse.json(
        {
          success: false,
          message: "Could not verify today's report.",
        },
        {
          status: 500,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    if (existingReport) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already submitted a partner report today.",
        },
        {
          status: 409,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    /**
     * 9. Save the partner report.
     *
     * review_date is the participant's local activity date.
     * created_at/reviewed_at remain database timestamps.
     */
    const { data: report, error: insertError } = await supabase
      .from("partner_reviews")
      .insert({
        reviewer_id: participant.id,
        partner_id: partnerId,
        partner_pair_id: activePair.id,
        review_date: todayString,
        submitted_on_time: payload.submittedOnTime,
        comment,
      })
      .select(
        "id, reviewer_id, partner_id, partner_pair_id, review_date, submitted_on_time, comment, reviewed_at, created_at",
      )
      .single();

    if (insertError) {
      console.error("Partner report creation failed:", insertError);

      // The database unique constraint remains the final protection
      // against concurrent duplicate report requests.
      if (insertError.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            message: "You have already submitted a partner report today.",
          },
          {
            status: 409,
            headers: { "Cache-Control": "private, no-store" },
          },
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Failed to submit partner report.",
        },
        {
          status: 500,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Partner report submitted successfully.",
        report,
        timezone,
        deadline: deadline.toISOString(),
      },
      {
        status: 201,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error) {
    console.error("Unexpected partner report error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred.",
      },
      {
        status: 500,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}
