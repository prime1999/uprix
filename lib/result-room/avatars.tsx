import male1 from "@/app/assets/images/profile/male/male1.jpg";
import male2 from "@/app/assets/images/profile/male/male2.jpg";
import male3 from "@/app/assets/images/profile/male/male3.jpg";
import male4 from "@/app/assets/images/profile/male/male4.jpg";
import female1 from "@/app/assets/images/profile/female/female1.jpg";
import female2 from "@/app/assets/images/profile/female/female2.jpg";
import female3 from "@/app/assets/images/profile/female/female3.jpg";
import female4 from "@/app/assets/images/profile/female/female4.jpg";

export const AVATARS = {
  "male-1": male1,
  "male-2": male2,
  "male-3": male3,
  "male-4": male4,
  "female-1": female1,
  "female-2": female2,
  "female-3": female3,
  "female-4": female4,
} as const;

export type AvatarKey = keyof typeof AVATARS;

/** Same pattern the /api/profile route should accept. */
export const AVATAR_KEY_PATTERN = /^(male|female)-[1-4]$/;

export const AVATAR_OPTIONS = (Object.keys(AVATARS) as AvatarKey[]).map(
  (key) => ({
    key,
    label: `${key.startsWith("male") ? "Male" : "Female"} avatar ${key.slice(-1)}`,
    src: AVATARS[key].src,
  }),
);

export function isAvatarKey(value: unknown): value is AvatarKey {
  return typeof value === "string" && value in AVATARS;
}

/**
 * Turns whatever is stored in avatar_url into something an <img> can show:
 * a built-in avatar key -> its image URL, an older real URL -> unchanged.
 * Use this everywhere an avatar_url is rendered (Topbar, partner card, ...).
 */
export function getAvatarUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  return isAvatarKey(value) ? AVATARS[value].src : value;
}
