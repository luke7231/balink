export type AcademyGalleryImageType = "logo" | "interior";

export interface AcademyGalleryImage {
  type: AcademyGalleryImageType;
  order: number;
  url: string;
  sourceUrl?: string | null;
}

export interface RawAcademyImages {
  logoUrl: string | null;
  gallery: AcademyGalleryImage[];
  companyProfileUrl?: string | null;
}

export interface StoredAcademyImages {
  logoUrl: string | null;
  gallery: AcademyGalleryImage[];
}

/** 발레매니아 등 빈 슬롯용 플레이스홀더 이미지 */
export function isAcademyPlaceholderImageUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return true;
  const normalized = url.trim().toLowerCase();
  return (
    normalized.includes("/images/no_img") ||
    normalized.includes("no_img.gif") ||
    normalized.includes("noimage") ||
    normalized.includes("no-image") ||
    // balletmania no_img.gif 를 S3에 미러링했을 때 생기는 content hash
    normalized.includes("57bfebfdb72f")
  );
}

export function pickAcademyThumbnailUrl(
  gallery: Array<{ url?: string | null; sourceUrl?: string | null }> | null | undefined,
  logoUrl?: string | null,
): string | null {
  for (const item of gallery ?? []) {
    if (isAcademyPlaceholderImageUrl(item.url) || isAcademyPlaceholderImageUrl(item.sourceUrl)) continue;
    if (item.url?.trim()) return item.url.trim();
  }
  if (logoUrl?.trim() && !isAcademyPlaceholderImageUrl(logoUrl)) return logoUrl.trim();
  return null;
}
