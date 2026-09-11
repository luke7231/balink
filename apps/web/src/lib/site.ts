/** Canonical production origin for SEO, OG, sitemap, and structured data. */
export const SITE_URL = "https://www.balink.co.kr";

export const SITE_NAME = "발링크";
export const SITE_NAME_EN = "balink";
export const SITE_TAGLINE = "Ballet Career, Connected";

export const SITE_DESCRIPTION =
  "발레 강사·학원을 위한 채용·대강 플랫폼. 지역·조건별 공고와 실시간 알림으로 커리어를 이어 보세요.";

export const SITE_DESCRIPTION_EN =
  "The career platform for ballet instructors and academies — job posts, substitute gigs, and tailored alerts.";

export const SITE_KEYWORDS = [
  "발링크",
  "balink",
  "발레 강사",
  "발레 채용",
  "발레 구인구직",
  "발레 대강",
  "발레학원 강사 모집",
  "ballet instructor jobs",
  "ballet career",
] as const;

export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** App Store / Play Store listing URLs for desktop web promo. */
export const APP_STORE_URL =
  "https://apps.apple.com/kr/app/%EB%B0%9C%EB%A7%81%ED%81%AC-%EB%B0%9C%EB%A0%88%EC%9D%B8%EC%9D%84-%EC%9C%84%ED%95%9C-%EC%BB%A4%EB%A6%AC%EC%96%B4-%ED%94%8C%EB%9E%AB%ED%8F%BC/id6803830145";

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.luke7231.balink";
