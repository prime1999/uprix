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
  const responseHeaders = {
    "Cache-Control": "private, no-store",
  };

  try {
    // 1. Validate the browser timezone.
    const timezone = request.headers.get("x-time-zone");

    if (!timezone || !isValidTimezone(timezone)) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid browser timezone is required.",
          code: "INVALID_TIMEZONE",
        },
        { status: 400, headers: responseHeaders },
      );
    }

    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    // 2. Authenticate the participant.
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const user = claimsData?.claims;

    if (claimsError || !user?.sub) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401, headers: responseHeaders },
      );
    }

    // 3. Find the participant.
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
        { status: 500, headers: responseHeaders },
      );
    }

    if (!participant) {
      return NextResponse.json(
        { success: false, message: "Participant not found." },
        { status: 404, headers: responseHeaders },
      );
    }

    if (participant.room_status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Your participation is not active.",
        },
        { status: 403, headers: responseHeaders },
      );
    }

    // 4. Parse and validate the request body.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400, headers: responseHeaders },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400, headers: responseHeaders },
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
        { status: 400, headers: responseHeaders },
      );
    }

    if (typeof payload.submittedOnTime !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please confirm whether your partner submitted their task on time.",
        },
        { status: 400, headers: responseHeaders },
      );
    }

    // 5. Validate the optional comment.
    let comment: string | null = null;

    if (payload.comment !== undefined && payload.comment !== null) {
      if (typeof payload.comment !== "string") {
        return NextResponse.json(
          { success: false, message: "Comment must be text." },
          { status: 400, headers: responseHeaders },
        );
      }

      comment = payload.comment.trim() || null;

      if (comment && comment.length > 2000) {
        return NextResponse.json(
          {
            success: false,
            message: "Comment cannot exceed 2000 characters.",
          },
          { status: 400, headers: responseHeaders },
        );
      }
    }

    // 6. Enforce today's reporting date and the 9:30 PM deadline.
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
        { status: 400, headers: responseHeaders },
      );
    }

    const deadline = getZonedDateTime(todayString, 21, 30, timezone);

    if (now.getTime() >= deadline.getTime()) {
      return NextResponse.json(
        {
          success: false,
          message: "Partner reporting is closed for today.",
          deadline: deadline.toISOString(),
          timezone,
        },
        { status: 403, headers: responseHeaders },
      );
    }

    // 7. Find the pair this participant is authorized to review.
    //
    // Mutual pair: reviewer_id is NULL, so either participant can report.
    // Directional pair: only the participant in reviewer_id can report
    // about the other member of that pair.
    //
    // Fetch all active pairs because a participant may have multiple rows
    // in a directional cycle.
    const { data: activePairs, error: pairError } = await supabase
      .from("partner_pairs")
      .select("id, participant_a_id, participant_b_id, reviewer_id")
      .eq("room_id", participant.room_id)
      .eq("status", "ACTIVE")
      .or(
        `participant_a_id.eq.${participant.id},participant_b_id.eq.${participant.id}`,
      );

    if (pairError) {
      console.error("Partner report pair lookup failed:", pairError);

      return NextResponse.json(
        {
          success: false,
          message: "Could not find your partner assignment.",
        },
        { status: 500, headers: responseHeaders },
      );
    }

    const eligiblePairs = (activePairs ?? []).filter((pair) => {
      const isMember =
        pair.participant_a_id === participant.id ||
        pair.participant_b_id === participant.id;

      if (!isMember) {
        return false;
      }

      return pair.reviewer_id === null || pair.reviewer_id === participant.id;
    });

    if (eligiblePairs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have an active partner assignment that allows you to submit this report.",
          code: "NO_ELIGIBLE_PARTNER_ASSIGNMENT",
        },
        { status: 403, headers: responseHeaders },
      );
    }

    if (eligiblePairs.length > 1) {
      console.error("Ambiguous partner report assignment:", {
        participantId: participant.id,
        pairIds: eligiblePairs.map((pair) => pair.id),
      });

      return NextResponse.json(
        {
          success: false,
          message:
            "Multiple eligible partner assignments were found. Please contact an administrator.",
          code: "AMBIGUOUS_PARTNER_ASSIGNMENT",
        },
        { status: 409, headers: responseHeaders },
      );
    }

    const activePair = eligiblePairs[0];

    const partnerId =
      activePair.participant_a_id === participant.id
        ? activePair.participant_b_id
        : activePair.participant_a_id;

    // 8. Prevent duplicate reports for this reviewer, partner, pair and date.
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
        { status: 500, headers: responseHeaders },
      );
    }

    if (existingReport) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already submitted a partner report today.",
        },
        { status: 409, headers: responseHeaders },
      );
    }

    // 9. Save the report against the authorized assignment.
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

      if (insertError.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            message: "You have already submitted a partner report today.",
          },
          { status: 409, headers: responseHeaders },
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Failed to submit partner report.",
        },
        { status: 500, headers: responseHeaders },
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
      { status: 201, headers: responseHeaders },
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
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
              // Cookie writes may be unavailable in this context.
            }
          },
        },
      },
    );

    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const user = claimsData?.claims;

    if (claimsError || !user?.sub) {
      return NextResponse.json({ success: false, message: "Unauthorized." });
    }

    const timezone = request.headers.get("x-time-zone");

    if (!timezone) {
      return NextResponse.json(
        { success: false, message: "A valid timezone is required." },
        { status: 400 },
      );
    }

    let dateFormatter: Intl.DateTimeFormat;
    let timeFormatter: Intl.DateTimeFormat;

    try {
      dateFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      timeFormatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid timezone." },
        { status: 400 },
      );
    }

    const now = new Date();
    const today = dateFormatter.format(now);
    const timeParts = timeFormatter.formatToParts(now);

    const hour = Number(timeParts.find((part) => part.type === "hour")?.value);
    const minute = Number(
      timeParts.find((part) => part.type === "minute")?.value,
    );

    if (hour > 21 || (hour === 21 && minute >= 30)) {
      return NextResponse.json(
        {
          success: false,
          message: "The partner report update deadline has passed.",
        },
        { status: 403 },
      );
    }

    let body: {
      reportId?: unknown;
      date?: unknown;
      comment?: unknown;
      submittedOnTime?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 },
      );
    }

    const { reportId, date, comment, submittedOnTime } = body;

    if (
      typeof reportId !== "string" ||
      !reportId.trim() ||
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      typeof submittedOnTime !== "boolean" ||
      (comment !== undefined && comment !== null && typeof comment !== "string")
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid partner report data." },
        { status: 400 },
      );
    }

    if (comment && comment.trim().length > 2000) {
      return NextResponse.json(
        {
          success: false,
          message: "The comment must not exceed 2000 characters.",
        },
        { status: 400 },
      );
    }

    if (date !== today) {
      return NextResponse.json(
        {
          success: false,
          message: "Only today's partner report can be updated.",
        },
        { status: 400 },
      );
    }

    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, room_id, room_status")
      .eq("user_id", user.sub)
      .maybeSingle();

    if (participantError) {
      console.error("Failed to fetch participant:", participantError);

      return NextResponse.json(
        { success: false, message: "Unable to verify your participation." },
        { status: 500 },
      );
    }

    if (!participant || participant.room_status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "An active room participation is required.",
        },
        { status: 403 },
      );
    }

    // The report must belong to this participant and must be today's report.
    const { data: existingReport, error: reportError } = await supabase
      .from("partner_reviews")
      .select(
        "id, reviewer_id, partner_id, partner_pair_id, review_date, submitted_on_time, comment, reviewed_at, created_at",
      )
      .eq("id", reportId)
      .eq("reviewer_id", participant.id)
      .eq("review_date", today)
      .maybeSingle();

    if (reportError) {
      console.error("Failed to fetch partner report:", reportError);

      return NextResponse.json(
        { success: false, message: "Unable to load the partner report." },
        { status: 500 },
      );
    }

    if (!existingReport) {
      return NextResponse.json(
        {
          success: false,
          message: "Today's partner report was not found or cannot be edited.",
        },
        { status: 404 },
      );
    }

    // Preserve the report ID, partner, pair, review date and created_at.
    const { data: updatedReport, error: updateError } = await supabase
      .from("partner_reviews")
      .update({
        submitted_on_time: submittedOnTime,
        comment: typeof comment === "string" ? comment.trim() || null : null,
        reviewed_at: now.toISOString(),
      })
      .eq("id", existingReport.id)
      .eq("reviewer_id", participant.id)
      .eq("review_date", today)
      .select(
        "id, reviewer_id, partner_id, partner_pair_id, review_date, submitted_on_time, comment, reviewed_at, created_at",
      )
      .single();

    if (updateError) {
      console.error("Failed to update partner report:", updateError);

      return NextResponse.json(
        { success: false, message: "Failed to update the partner report." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Partner report updated successfully.",
      report: updatedReport,
    });
  } catch (error) {
    console.error("Unexpected partner report update error:", error);

    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
