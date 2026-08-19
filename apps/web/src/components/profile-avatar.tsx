import Image from "next/image";
import { DEFAULT_AVATAR_PATH } from "@/lib/profile-image";

export function isDefaultAvatar(src: string | null | undefined): boolean {
  if (!src) return true;
  return src === DEFAULT_AVATAR_PATH || src.endsWith("/avatars/default.svg");
}

function DefaultAvatarGlyph({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <rect width="96" height="96" rx="48" fill="var(--accent-subtle)" />
      <circle cx="48" cy="38" r="16" fill="var(--accent)" />
      <path d="M18 82c4.5-16 14-24 30-24s25.5 8 30 24" fill="var(--accent)" />
    </svg>
  );
}

interface ProfileAvatarProps {
  src?: string | null;
  size: number;
  className?: string;
  alt?: string;
}

export function ProfileAvatar({
  src,
  size,
  className = "rounded-full object-cover",
  alt = "",
}: ProfileAvatarProps) {
  if (isDefaultAvatar(src)) {
    return <DefaultAvatarGlyph size={size} className={className} />;
  }

  return (
    <Image
      src={src!}
      alt={alt}
      width={size}
      height={size}
      className={className}
      unoptimized
    />
  );
}
