import Image, { type StaticImageData } from "next/image";
import { AVATARS, isAvatarKey } from "@/lib/result-room/avatars";

interface AvatarImageProps {
  /** A built-in avatar key ("male-1"), a real image URL, or empty. */
  value: string | null | undefined;
  alt?: string;
  /** Rendered size hint, e.g. "32px" - lets Next ship a tiny image. */
  sizes: string;
  className?: string;
  priority?: boolean;
  /** Shown when `value` is empty (or its URL fails to load). */
  fallback?: StaticImageData;
}

/**
 * Renders an avatar the fast way: built-in avatars go through next/image
 * (resized + converted to a small WebP at the size you ask for), while real
 * URLs fall back to a plain <img>.
 */
export default function AvatarImage({
  value,
  alt = "",
  sizes,
  className,
  priority,
  fallback,
}: AvatarImageProps) {
  if (isAvatarKey(value)) {
    return (
      <Image
        src={AVATARS[value]}
        alt={alt}
        sizes={sizes}
        priority={priority}
        draggable={false}
        className={className}
      />
    );
  }

  if (value) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={value}
        alt={alt}
        draggable={false}
        className={className}
        onError={(event) => {
          if (!fallback) return;
          event.currentTarget.onerror = null;
          event.currentTarget.src = fallback.src;
        }}
      />
    );
  }

  if (fallback) {
    return (
      <Image
        src={fallback}
        alt={alt}
        sizes={sizes}
        priority={priority}
        draggable={false}
        className={className}
      />
    );
  }

  return null;
}
