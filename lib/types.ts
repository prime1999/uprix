export type Option = {
  value: string;
  label: string;
};

export type ProfileFormData = {
  fullName: string;
  ageGroup: string;
  gender: string;
  currentStatus: string;
  university: string;
  universityOther: string;
  location: string;
  currentStage: string;
  currentFocus: string[];
  currentFocusOther: string;
  guidanceAreas: string[];
  guidanceAreasOther: string;
  biggestStruggle: string;
  progressBlocker: string;
  progressBlockerOther: string;
  biggestFear: string;
  teachingStyle: string[];
  activeOnlineTime: string;
  ninetyDayGoal: string;
};

export type ArrayFieldKey = "currentFocus" | "guidanceAreas" | "teachingStyle";

export type SingleChipFieldKey = "progressBlocker" | "activeOnlineTime";
