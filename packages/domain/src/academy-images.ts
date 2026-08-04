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

export interface AcademyThumbnail {
  url: string;
  type: AcademyGalleryImageType;
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

function isUsableImageUrl(url: string | null | undefined): url is string {
  return Boolean(url?.trim()) && !isAcademyPlaceholderImageUrl(url);
}

export function pickAcademyThumbnail(
  gallery: Array<{
    type?: string | null;
    url?: string | null;
    sourceUrl?: string | null;
  }> | null | undefined,
  logoUrl?: string | null,
): AcademyThumbnail | null {
  const usable = (gallery ?? []).filter((item) => {
    if (!isUsableImageUrl(item.url)) return false;
    // sourceUrl이 있을 때만 원본 플레이스홀더 여부를 검사한다.
    if (item.sourceUrl?.trim() && isAcademyPlaceholderImageUrl(item.sourceUrl)) return false;
    return true;
  });

  const interior = usable.find((item) => item.type === "interior");
  if (interior?.url?.trim()) {
    return { url: interior.url.trim(), type: "interior" };
  }

  if (isUsableImageUrl(logoUrl)) {
    return { url: logoUrl.trim(), type: "logo" };
  }

  const fallback = usable.find((item) => item.url?.trim());
  if (fallback?.url?.trim()) {
    return {
      url: fallback.url.trim(),
      type: fallback.type === "logo" ? "logo" : "interior",
    };
  }

  return null;
}

export function pickAcademyThumbnailUrl(
  gallery: Array<{ url?: string | null; sourceUrl?: string | null; type?: string | null }> | null | undefined,
  logoUrl?: string | null,
): string | null {
  return pickAcademyThumbnail(gallery, logoUrl)?.url ?? null;
}
