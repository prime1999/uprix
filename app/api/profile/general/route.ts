import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ageGroups = ["under_18", "18_24", "25_34", "35_44", "45_plus"] as const;

const genders = ["male", "female"] as const;

const currentStatuses = [
  "student",
  "working",
  "business_owner",
  "freelancer",
  "student_and_working",
] as const;

const universities = [
  "covenant_university",
  "university_of_ibadan",
  "bowen",
  "obafemi_awolowo_university",
  "lasu",
  "lautech",
  "fuoye",
  "other",
] as const;

const currentStages = [
  "just_starting",
  "trying_but_inconsistent",
  "clarity_but_struggle_with_execution",
  "growing_but_want_to_scale",
] as const;

const focusAreas = [
  "starting_business",
  "growing_business",
  "personal_brand",
  "high_income_skill",
  "mindset",
  "productivity",
  "making_money",
  "discipline",
  "other",
] as const;

const guidanceAreas = [
  "business_branding_sales",
  "content_creation_positioning",
  "lead_generation_client_attraction",
  "team_building_leadership",
  "self_development_mindset",
  "time_task_management",
  "discipline_consistency",
  "confidence_communication",
  "monetizing_skill",
  "balancing_business_school",
  "financial_growth_money_habits",
  "clarity_direction_life",
  "other",
] as const;

const progressBlockers = [
  "lack_of_clarity",
  "fear_of_failure",
  "procrastination",
  "distractions",
  "dont_know_where_to_start",
  "inconsistency",
  "self_doubt",
  "lack_of_discipline",
  "other",
] as const;

const teachingStyles = [
  "practical_step_by_step",
  "real_life_examples",
  "tough_motivational_truths",
  "deep_mindset_teachings",
  "short_daily_lessons",
  "series_based_teachings",
] as const;

const onlineTimes = ["morning", "afternoon", "evening", "night"] as const;

const requiredText = z.string().trim().min(1).max(2000);

const optionalText = z.string().trim().max(2000).nullable();

const dateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, "Provide a valid date.");

const avatarSchema = z
  .string()
  .max(2000)
  .refine((value) => value === value.trim(), {
    message: "avatar_url cannot contain surrounding whitespace.",
  })
  .refine((value) => {
    // Existing avatar identifiers, e.g. male-1.
    if (/^[a-zA-Z0-9_-]+$/.test(value)) {
      return true;
    }

    try {
      const url = new URL(value);

      return (
        (url.protocol === "https:" || url.protocol === "http:") &&
        Boolean(url.hostname)
      );
    } catch {
      return false;
    }
  }, "Provide a valid avatar identifier or HTTP/HTTPS URL.");

const updateProfileSchema = z
  .object({
    // Personal details
    full_name: requiredText.max(200).optional(),
    date_of_birth: dateOfBirthSchema.nullable().optional(),
    age_group: z.enum(ageGroups).optional(),
    gender: z.enum(genders).optional(),
    location: requiredText.optional(),

    // Education and current status
    current_status: z.enum(currentStatuses).optional(),
    university: z.enum(universities).nullable().optional(),
    university_other: optionalText.optional(),
    current_stage: z.enum(currentStages).optional(),

    // Focus areas
    current_focus: z.array(z.enum(focusAreas)).min(1).optional(),
    current_focus_other: optionalText.optional(),

    // Guidance preferences
    guidance_areas: z.array(z.enum(guidanceAreas)).min(1).optional(),
    guidance_areas_other: optionalText.optional(),

    // Challenges
    biggest_struggle: requiredText.optional(),
    progress_blocker: z.enum(progressBlockers).optional(),
    progress_blocker_other: optionalText.optional(),
    biggest_fear: requiredText.optional(),

    // Learning preferences
    teaching_style: z.array(z.enum(teachingStyles)).min(1).optional(),
    active_online_time: z.enum(onlineTimes).optional(),

    // Goal
    ninety_day_goal: requiredText.optional(),

    // Profile picture
    avatar_url: avatarSchema.nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  });

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

    // 3. Validate supplied fields.
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid profile update.",
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const updates = validation.data;

    // 4. Update only supplied fields.
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("User profile update failed:", {
        userId,
        code: error.code,
        message: error.message,
      });

      if (error.code === "23514") {
        return NextResponse.json(
          {
            error:
              "The update conflicts with a profile requirement. Check the selected options and their required 'other' fields.",
          },
          { status: 400 },
        );
      }

      if (error.code === "22P02" || error.code === "22007") {
        return NextResponse.json(
          { error: "One or more supplied values are invalid." },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: "Failed to update your profile." },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Profile not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully.",
      profile: data,
    });
  } catch (error) {
    console.error("User profile API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
