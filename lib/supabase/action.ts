import { createClient } from "./client";

const supabase = createClient();

export interface ProfileFormData {
  fullName: string;

  ageGroup: "under_18" | "18_24" | "25_34" | "35_44" | "45_plus";
  gender: "male" | "female";

  currentStatus:
    | "student"
    | "working"
    | "business_owner"
    | "freelancer"
    | "student_and_working";

  university?:
    | "covenant_university"
    | "university_of_ibadan"
    | "bowen"
    | "obafemi_awolowo_university"
    | "lasu"
    | "lautech"
    | "fuoye"
    | "other";

  universityOther?: string;

  location: string;

  currentStage:
    | "just_starting"
    | "trying_but_inconsistent"
    | "clarity_but_struggle_with_execution"
    | "growing_but_want_to_scale";

  currentFocus: string[];
  currentFocusOther?: string;

  guidanceAreas: string[];
  guidanceAreasOther?: string;

  biggestStruggle: string;

  progressBlocker:
    | "lack_of_clarity"
    | "fear_of_failure"
    | "procrastination"
    | "distractions"
    | "dont_know_where_to_start"
    | "inconsistency"
    | "self_doubt"
    | "lack_of_discipline"
    | "other";

  progressBlockerOther?: string;

  biggestFear: string;

  teachingStyle: string[];

  activeOnlineTime: "morning" | "afternoon" | "evening" | "night";

  ninetyDayGoal: string;
}

export const createProfile = async (formData: ProfileFormData) => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User is not authenticated");
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .insert({
      user_id: user.id,

      // Demographics
      full_name: formData.fullName,
      age_group: formData.ageGroup,
      gender: formData.gender,
      current_status: formData.currentStatus,

      university: formData.university || null,
      university_other: formData.universityOther?.trim() || null,

      location: formData.location,

      // Current stage
      current_stage: formData.currentStage,

      // Current focus
      current_focus: formData.currentFocus,
      current_focus_other: formData.currentFocusOther?.trim() || null,

      // Guidance
      guidance_areas: formData.guidanceAreas,
      guidance_areas_other: formData.guidanceAreasOther?.trim() || null,

      // Struggles
      biggest_struggle: formData.biggestStruggle,

      progress_blocker: formData.progressBlocker,
      progress_blocker_other: formData.progressBlockerOther?.trim() || null,

      biggest_fear: formData.biggestFear,

      // Learning
      teaching_style: formData.teachingStyle,
      active_online_time: formData.activeOnlineTime,

      // Goal
      ninety_day_goal: formData.ninetyDayGoal,

      // Completion
      step: 5,
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Profile creation error:", error);
    throw error;
  }

  return data;
};
