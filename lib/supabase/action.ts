import { createClient } from "./client";
import type { ProfileFormData } from "@/lib/types";

const supabase = createClient();

export const getProfile = async () => {
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
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Profile retrieval error:", error);
    throw error;
  }

  return data;
};

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

  console.log({ formData, user });

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

  console.log("Profile created successfully:", data);

  return data;
};
