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
