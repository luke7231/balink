const SIDO_DISPLAY_LABELS: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  제주특별자치도: "제주",
};

const ACADEMY_LOCATION_PATTERN = /학원|아카데미|academy|ballet\s*studio|댄스|무용|센터|studio/i;
const ADMIN_LOCATION_PATTERN = /(?:특별시|광역시|특별자치|도)\s|[가-힣]+(?:시|군|구)\s|[가-힣0-9]+(?:동|읍|면|리|역)\b/;

export function formatSidoForDisplay(sido: string | null | undefined): string | null {
  if (!sido?.trim()) return null;
  return SIDO_DISPLAY_LABELS[sido.trim()] ?? sido.trim();
}

export function formatAdminLocationDisplay(
  sido: string | null | undefined,
  sigungu: string | null | undefined,
  dongOrStation?: string | null,
): string | null {
  const displaySido = formatSidoForDisplay(sido);
  const parts = [displaySido, sigungu?.trim() || null, dongOrStation?.trim() || null].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

export function isAcademyOnlyLocationText(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  const text = value.trim();
  if (ADMIN_LOCATION_PATTERN.test(text)) return false;
  return ACADEMY_LOCATION_PATTERN.test(text) || !/(특별시|광역시|특별자치|도|시|군|구|동|역)/.test(text);
}

export function sanitizeLocationTextForStorage(
  locationText: string | null | undefined,
  sido: string | null | undefined,
  sigungu: string | null | undefined,
  dongOrStation?: string | null,
): string | null {
  const adminDisplay = formatAdminLocationDisplay(sido, sigungu, dongOrStation);
  if (adminDisplay) return adminDisplay;
  if (isAcademyOnlyLocationText(locationText)) return null;
  if (locationText?.trim() && ADMIN_LOCATION_PATTERN.test(locationText.trim())) {
    return locationText.trim();
  }
  return null;
}
