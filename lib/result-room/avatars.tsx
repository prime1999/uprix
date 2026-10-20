import male1 from "@/app/assets/images/profile/male/male1.jpg";
import male2 from "@/app/assets/images/profile/male/male2.jpg";
import male3 from "@/app/assets/images/profile/male/male3.jpg";
import male4 from "@/app/assets/images/profile/male/male4.jpg";
import female1 from "@/app/assets/images/profile/female/female1.jpg";
import female2 from "@/app/assets/images/profile/female/female2.jpg";
import female3 from "@/app/assets/images/profile/female/female3.jpg";
import female4 from "@/app/assets/images/profile/female/female4.jpg";

export const AVATARS_MALE = {
  "male-1": male1,
  "male-2": male2,
  "male-3": male3,
  "male-4": male4,
} as const;

export const AVATARS_FEMALE = {
  "female-1": female1,
  "female-2": female2,
  "female-3": female3,
  "female-4": female4,
} as const;

export const ALL_AVATARS = {
  ...AVATARS_MALE,
  ...AVATARS_FEMALE,
} as const;

export type AvatarMaleKey = keyof typeof AVATARS_MALE;
export type AvatarFemaleKey = keyof typeof AVATARS_FEMALE;
export type AvatarKey = keyof typeof ALL_AVATARS;
export type Gender = string | null;

export interface AvatarOption {
  key: AvatarKey;
  label: string;
  src: string;
}

/** Same pattern the /api/profile route should accept. */
export const AVATAR_KEY_PATTERN = /^(male|female)-[1-4]$/;

export const AVATAR_OPTIONS_MALE: AvatarOption[] = (
  Object.keys(AVATARS_MALE) as AvatarMaleKey[]
).map((key) => ({
  key,
  label: `Male avatar ${key.slice(-1)}`,
  src: AVATARS_MALE[key].src,
}));

export const AVATAR_OPTIONS_FEMALE: AvatarOption[] = (
  Object.keys(AVATARS_FEMALE) as AvatarFemaleKey[]
).map((key) => ({
  key,
  label: `Female avatar ${key.slice(-1)}`,
  src: AVATARS_FEMALE[key].src,
}));

/**
 * Returns the array of avatar options filtered by gender.
 */
export function getAvatarsByGender(gender: Gender): AvatarOption[] {
  return gender === "male" ? AVATAR_OPTIONS_MALE : AVATAR_OPTIONS_FEMALE;
}

export function isAvatarKey(value: unknown): value is AvatarKey {
  return typeof value === "string" && value in ALL_AVATARS;
}

/**
 * Turns whatever is stored in avatar_url into something an <img> can show:
 * a built-in avatar key -> its image URL, an older real URL -> unchanged.
 */
export function getAvatarUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  return isAvatarKey(value) ? ALL_AVATARS[value].src : value;
}
