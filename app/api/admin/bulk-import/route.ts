import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

export const maxDuration = 300;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const DEFAULT_PASSWORD = "uprix2026";

/* ============================================================================
   STRING CLEANING & NORMALIZATION HELPERS
============================================================================ */

function cleanText(str: any): string {
  if (!str) return "";
  return str
    .toString()
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, "")
    .trim();
}

function normalizeForMatching(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Basic regex validator for email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/* ============================================================================
   EXPLICIT VALUE MAPPERS
============================================================================ */

function mapAgeGroup(raw: any): string | null {
  const norm = normalizeForMatching(cleanText(raw));
  if (!norm) return null;
  if (norm.includes("under18")) return "under_18";
  if (norm.includes("18") && norm.includes("24")) return "18_24";
  if (norm.includes("25") && norm.includes("34")) return "25_34";
  if (norm.includes("35") && norm.includes("44")) return "35_44";
  if (norm.includes("45")) return "45_plus";
  return null;
}

function mapGender(raw: any): string | null {
  const norm = normalizeForMatching(cleanText(raw));
  if (norm.includes("female") || norm.includes("woman")) return "female";
  if (norm.includes("male") || norm.includes("man")) return "male";
  return null;
}

function mapCurrentStatus(raw: any): string | null {
  const norm = normalizeForMatching(cleanText(raw));
  if (!norm) return null;
  if (
    norm.includes("both") ||
    (norm.includes("student") && norm.includes("working"))
  )
    return "student_and_working";
  if (norm.includes("business")) return "business_owner";
  if (norm.includes("freelance")) return "freelancer";
  if (norm.includes("working")) return "working";
  if (norm.includes("student")) return "student";
  return null;
}

function mapUniversity(raw: any): string | null {
  const norm = normalizeForMatching(cleanText(raw));
  if (!norm) return null;
  if (norm.includes("covenant")) return "covenant_university";
  if (norm.includes("ibadan") || norm.includes("ui"))
    return "university_of_ibadan";
  if (norm.includes("bowen")) return "bowen";
  if (norm.includes("obafemi") || norm.includes("oau"))
    return "obafemi_awolowo_university";
  if (norm.includes("lasu")) return "lasu";
  if (norm.includes("lautech")) return "lautech";
  if (norm.includes("fuoye")) return "fuoye";
  if (norm.length > 0) return "other";
  return null;
}

function mapCurrentStage(raw: any): string | null {
  const norm = normalizeForMatching(cleanText(raw));
  if (!norm) return null;
  if (norm.includes("starting")) return "just_starting";
  if (norm.includes("inconsistent")) return "trying_but_inconsistent";
  if (norm.includes("clarity") || norm.includes("execution"))
    return "clarity_but_struggle_with_execution";
  if (norm.includes("scale") || norm.includes("growing"))
    return "growing_but_want_to_scale";
  return null;
}

function mapFocusArea(raw: any): string | null {
  const norm = normalizeForMatching(cleanText(raw));
  if (!norm) return null;
  if (norm.includes("startingabusiness")) return "starting_business";
  if (norm.includes("growingabusiness") || norm.includes("growingbusiness"))
    return "growing_business";
  if (norm.includes("personalbrand") || norm.includes("brand"))
    return "personal_brand";
  if (norm.includes("highincome") || norm.includes("skill"))
    return "high_income_skill";
  if (norm.includes("mindset")) return "mindset";
  if (norm.includes("productiv")) return "productivity";
  if (norm.includes("money") || norm.includes("makingmoney"))
    return "making_money";
  if (norm.includes("discipline")) return "discipline";
  return "other";
}

function mapGuidanceArea(raw: any): string | null {
  const norm = normalizeForMatching(cleanText(raw));
  if (!norm) return null;
  if (norm.includes("sales") || norm.includes("businessbranding"))
    return "business_branding_sales";
  if (norm.includes("content") || norm.includes("positioning"))
    return "content_creation_positioning";
  if (norm.includes("lead") || norm.includes("attraction"))
    return "lead_generation_client_attraction";
  if (norm.includes("team") || norm.includes("leadership"))
    return "team_building_leadership";
  if (norm.includes("selfdevelopment") || norm.includes("mindset"))
    return "self_development_mindset";
  if (norm.includes("time") || norm.includes("task"))
    return "time_task_management";
  if (norm.includes("discipline") || norm.includes("consistency"))
    return "discipline_consistency";
  if (norm.includes("confidence") || norm.includes("communication"))
    return "confidence_communication";
  if (norm.includes("monetiz")) return "monetizing_skill";
  if (norm.includes("balancing") || norm.includes("school"))
    return "balancing_business_school";
  if (norm.includes("financial") || norm.includes("moneyhabits"))
    return "financial_growth_money_habits";
  if (norm.includes("clarity") || norm.includes("direction"))
    return "clarity_direction_life";
  return "other";
}

function mapProgressBlocker(raw: any): string | null {
  const norm = normalizeForMatching(cleanText(raw));
  if (!norm) return null;
  if (norm.includes("lackofclarity")) return "lack_of_clarity";
  if (norm.includes("fearoffailure") || norm.includes("failure"))
    return "fear_of_failure";
  if (norm.includes("procrastination")) return "procrastination";
  if (norm.includes("distraction")) return "distractions";
  if (norm.includes("wheretostart") || norm.includes("dontknow"))
    return "dont_know_where_to_start";
  if (norm.includes("inconsistency")) return "inconsistency";
  if (norm.includes("selfdoubt") || norm.includes("doubt")) return "self_doubt";
  if (norm.includes("lackofdiscipline")) return "lack_of_discipline";
  return "other";
}

function mapTeachingStyle(raw: any): string | null {
  const norm = normalizeForMatching(cleanText(raw));
  if (!norm) return null;
  if (norm.includes("stepbystep") || norm.includes("practical"))
    return "practical_step_by_step";
  if (norm.includes("reallife") || norm.includes("example"))
    return "real_life_examples";
  if (norm.includes("tough") || norm.includes("motivational"))
    return "tough_motivational_truths";
  if (norm.includes("deep") || norm.includes("mindset"))
    return "deep_mindset_teachings";
  if (norm.includes("short") || norm.includes("daily"))
    return "short_daily_lessons";
  if (norm.includes("series") || norm.includes("part1"))
    return "series_based_teachings";
  return null;
}

function mapActiveOnlineTime(raw: any): string | null {
  const norm = normalizeForMatching(cleanText(raw));
  if (norm.includes("morning")) return "morning";
  if (norm.includes("afternoon")) return "afternoon";
  if (norm.includes("evening")) return "evening";
  if (norm.includes("night")) return "night";
  return null;
}

/* ============================================================================
   ARRAY AND CONSTRAINT PARSERS
============================================================================ */

function parseArrayField(
  raw: any,
  mapper: (item: string) => string | null,
): string[] {
  const cleaned = cleanText(raw);
  if (!cleaned) return [];

  return cleaned
    .split(",")
    .map((item) => mapper(item))
    .filter((item): item is string => item !== null);
}

function parseArrayAndOtherField(
  rawCsvField: any,
  rawOtherText: any,
  mapper: (item: string) => string | null,
): { values: string[]; otherText: string | null } {
  const cleaned = cleanText(rawCsvField);
  const userProvidedOther = cleanText(rawOtherText);

  if (!cleaned && !userProvidedOther) {
    return { values: [], otherText: null };
  }

  const parts = cleaned ? cleaned.split(",") : [];
  let hasUnrecognized = false;
  const matchedValues: string[] = [];

  for (const item of parts) {
    const mapped = mapper(item);
    if (mapped === "other") {
      hasUnrecognized = true;
    } else if (mapped) {
      if (!matchedValues.includes(mapped)) matchedValues.push(mapped);
    } else {
      hasUnrecognized = true;
    }
  }

  const containsOther =
    matchedValues.includes("other") ||
    hasUnrecognized ||
    Boolean(userProvidedOther);

  if (containsOther) {
    if (!matchedValues.includes("other")) matchedValues.push("other");
    return {
      values: matchedValues,
      otherText: userProvidedOther || "Not specified",
    };
  }

  return {
    values: matchedValues,
    otherText: null,
  };
}

/* ============================================================================
   MAIN API ROUTE HANDLER
============================================================================ */

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("x-admin-secret");
    if (authHeader !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const start = parseInt(searchParams.get("start") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded. Please include a 'file' field." },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const allRecords: any[] = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
    });
    const batchRecords = allRecords.slice(start, start + limit);

    let successCount = 0;
    const failedUsers: any[] = [];

    for (const row of batchRecords) {
      try {
        const emailKey = Object.keys(row).find((k) =>
          k.toLowerCase().includes("email"),
        );
        const email = emailKey ? cleanText(row[emailKey]) : "";

        // Omit rows without emails or invalid email formats completely
        if (!email || !isValidEmail(email)) {
          continue;
        }

        const fullName = cleanText(
          row.full_name || row.fullName || row["Full Name"],
        );
        let userId: string | null = null;

        // Step 1: User Auth Provisioning
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email,
            password: DEFAULT_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: fullName },
          });

        if (authError) {
          if (
            authError.message.toLowerCase().includes("already been registered")
          ) {
            const { data: usersData } =
              await supabaseAdmin.auth.admin.listUsers();
            const existingUser = usersData?.users.find(
              (u) => u.email?.toLowerCase() === email.toLowerCase(),
            );

            if (existingUser) {
              userId = existingUser.id;
            } else {
              failedUsers.push({
                ...row,
                error_reason: "Auth Error: Could not resolve user ID",
              });
              continue;
            }
          } else {
            failedUsers.push({
              ...row,
              error_reason: `Auth Error: ${authError.message}`,
            });
            continue;
          }
        } else {
          userId = authData.user.id;
        }

        // Step 2: Map Raw Data
        const focusResult = parseArrayAndOtherField(
          row.current_focus || row.currentFocus,
          row.current_focus_other || row.currentFocusOther,
          mapFocusArea,
        );

        const guidanceResult = parseArrayAndOtherField(
          row.guidance_areas || row.guidanceAreas,
          row.guidance_areas_other || row.guidanceAreasOther,
          mapGuidanceArea,
        );

        const mappedBlocker = mapProgressBlocker(
          row.progress_blocker || row.progressBlocker,
        );
        const userBlockerOther = cleanText(
          row.progress_blocker_other || row.progressBlockerOther,
        );
        const finalBlockerOther =
          mappedBlocker === "other"
            ? userBlockerOther || "Not specified"
            : null;

        const teachingStyleArray = parseArrayField(
          row.teaching_style || row.teachingStyle,
          mapTeachingStyle,
        );

        const mappedUni = mapUniversity(row.university);
        const userUniOther = cleanText(
          row.university_other || row.universityOther,
        );
        const finalUniOther =
          mappedUni === "other" ? userUniOther || "Not specified" : null;

        // Step 3: Upsert User Profile
        const { error: profileError } = await supabaseAdmin
          .from("user_profiles")
          .upsert(
            {
              user_id: userId,
              full_name: fullName || null,
              age_group: mapAgeGroup(row.age_group || row.ageGroup),
              gender: mapGender(row.gender),
              current_status: mapCurrentStatus(
                row.current_status || row.currentStatus,
              ),
              university: mappedUni,
              university_other: finalUniOther,
              location: cleanText(row.location) || null,
              current_stage: mapCurrentStage(
                row.current_stage || row["current_stage?"] || row.currentStage,
              ),

              current_focus: focusResult.values,
              current_focus_other: focusResult.otherText,

              guidance_areas: guidanceResult.values,
              guidance_areas_other: guidanceResult.otherText,

              biggest_struggle:
                cleanText(row.biggest_struggle || row.biggestStruggle) || null,
              progress_blocker: mappedBlocker,
              progress_blocker_other: finalBlockerOther,
              biggest_fear:
                cleanText(row.biggest_fear || row.biggestFear) || null,
              teaching_style: teachingStyleArray,
              active_online_time: mapActiveOnlineTime(
                row.active_online_time || row.activeOnlineTime,
              ),
              ninety_day_goal:
                cleanText(row.ninety_day_goal || row.ninetyDayGoal) || null,
              step: 5,
              completed: true,
              completed_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );

        if (profileError) {
          failedUsers.push({
            ...row,
            error_reason: `Profile Error: ${profileError.message}`,
          });
        } else {
          successCount++;
        }
      } catch (err: any) {
        failedUsers.push({
          ...row,
          error_reason: `Runtime Error: ${err?.message || "Unknown error"}`,
        });
      }
    }

    const nextStart = start + batchRecords.length;
    const hasMore = nextStart < allRecords.length;

    return NextResponse.json({
      message: `Batch complete: processed rows ${start} to ${start + batchRecords.length - 1}`,
      totalFileRows: allRecords.length,
      batchSizeProcessed: batchRecords.length,
      successCount,
      failedCount: failedUsers.length,
      nextSuggestedUrl: hasMore
        ? `/api/admin/bulk-import?start=${nextStart}&limit=${limit}`
        : "Done! All rows processed.",
      failedUsers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
