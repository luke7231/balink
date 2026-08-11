import type { AcademyGalleryImage } from "./academy-images.js";
import type { JobPostSummary } from "./job-post.js";

export type OrganizationType = "ACADEMY" | "DISPATCH_AGENCY" | "UNKNOWN";

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  ACADEMY: "무용학원",
  DISPATCH_AGENCY: "파견회사",
  UNKNOWN: "기타",
};

export interface OrganizationSummary {
  id: string;
  name: string;
  type: OrganizationType;
  sido: string | null;
  sigungu: string | null;
  dongOrStation: string | null;
  logoUrl: string | null;
  externalProfileUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationDetail extends OrganizationSummary {
  phones: string[];
  emails: string[];
  gallery: AcademyGalleryImage[];
  jobPosts: JobPostSummary[];
  jobPostCount: number;
}

/** 공고에서 조직을 만들거나 매칭할 때 쓰는 후보 */
export interface OrganizationCandidate {
  name: string;
  normalizedName: string;
  type: OrganizationType;
  matchKey: string;
  sido: string | null;
  sigungu: string | null;
  dongOrStation: string | null;
  phones: string[];
  emails: string[];
  logoUrl: string | null;
  gallery: AcademyGalleryImage[];
  externalProfileUrl: string | null;
  evidence: string[];
}

export type OrganizationMatchDecision =
  | { kind: "create"; candidate: OrganizationCandidate }
  | { kind: "reuse"; organizationId: string; candidate: OrganizationCandidate; reason: string }
  | { kind: "ambiguous"; candidate: OrganizationCandidate; reason: string; candidateIds: string[] }
  | { kind: "skip"; reason: string };

export interface OrganizationExisting {
  id: string;
  name: string;
  normalizedName: string;
  type: OrganizationType;
  matchKey: string;
  sido: string | null;
  sigungu: string | null;
  dongOrStation: string | null;
  phones: string[];
  emails: string[];
  logoUrl: string | null;
  gallery: AcademyGalleryImage[];
  externalProfileUrl: string | null;
}

export function decideOrganizationMatch(
  candidate: OrganizationCandidate,
  existing: OrganizationExisting[],
): OrganizationMatchDecision {
  const byMatchKey = existing.filter((org) => org.matchKey === candidate.matchKey);
  if (byMatchKey.length === 1) {
    return {
      kind: "reuse",
      organizationId: byMatchKey[0]!.id,
      candidate,
      reason: `matchKey:${candidate.matchKey}`,
    };
  }
  if (byMatchKey.length > 1) {
    return {
      kind: "ambiguous",
      candidate,
      reason: `duplicate matchKey:${candidate.matchKey}`,
      candidateIds: byMatchKey.map((org) => org.id),
    };
  }

  const byProfile = candidate.externalProfileUrl
    ? existing.filter((org) => org.externalProfileUrl === candidate.externalProfileUrl)
    : [];
  if (byProfile.length === 1) {
    return {
      kind: "reuse",
      organizationId: byProfile[0]!.id,
      candidate,
      reason: "externalProfileUrl",
    };
  }
  if (byProfile.length > 1) {
    return {
      kind: "ambiguous",
      candidate,
      reason: "multiple externalProfileUrl matches",
      candidateIds: byProfile.map((org) => org.id),
    };
  }

  const candidatePhones = new Set(candidate.phones);
  const byPhone = candidatePhones.size
    ? existing.filter((org) => org.phones.some((phone) => candidatePhones.has(normalizePhone(phone))))
    : [];
  if (byPhone.length === 1) {
    return {
      kind: "reuse",
      organizationId: byPhone[0]!.id,
      candidate,
      reason: "phone",
    };
  }
  if (byPhone.length > 1) {
    return {
      kind: "ambiguous",
      candidate,
      reason: "multiple phone matches",
      candidateIds: byPhone.map((org) => org.id),
    };
  }

  const byNameRegion = existing.filter(
    (org) =>
      org.normalizedName === candidate.normalizedName &&
      (org.sido ?? "") === (candidate.sido ?? "") &&
      (org.sigungu ?? "") === (candidate.sigungu ?? ""),
  );
  if (byNameRegion.length === 1) {
    return {
      kind: "reuse",
      organizationId: byNameRegion[0]!.id,
      candidate,
      reason: "name+region",
    };
  }
  if (byNameRegion.length > 1) {
    return {
      kind: "ambiguous",
      candidate,
      reason: "multiple name+region matches",
      candidateIds: byNameRegion.map((org) => org.id),
    };
  }

  // 같은 이름인데 지역이 다르면 자동 병합하지 않는다.
  const sameNameDifferentRegion = existing.filter(
    (org) =>
      org.normalizedName === candidate.normalizedName &&
      ((org.sido ?? "") !== (candidate.sido ?? "") || (org.sigungu ?? "") !== (candidate.sigungu ?? "")),
  );
  if (sameNameDifferentRegion.length > 0 && (!candidate.sido || !candidate.sigungu)) {
    return {
      kind: "ambiguous",
      candidate,
      reason: "same name without enough region to disambiguate",
      candidateIds: sameNameDifferentRegion.map((org) => org.id),
    };
  }

  return { kind: "create", candidate };
}

export function mergeOrganizationFields(
  existing: OrganizationExisting,
  candidate: OrganizationCandidate,
): Partial<OrganizationExisting> {
  const phones = uniqueStrings([
    ...existing.phones.map(normalizePhone),
    ...candidate.phones.map(normalizePhone),
  ].filter((phone) => phone.length >= 8));
  const emails = uniqueStrings([
    ...existing.emails.map(normalizeEmail),
    ...candidate.emails.map(normalizeEmail),
  ].filter(Boolean));
  const gallery = mergeGallery(existing.gallery, candidate.gallery);

  return {
    name: existing.name || candidate.name,
    type: existing.type === "UNKNOWN" && candidate.type !== "UNKNOWN" ? candidate.type : existing.type,
    sido: existing.sido ?? candidate.sido,
    sigungu: existing.sigungu ?? candidate.sigungu,
    dongOrStation: existing.dongOrStation ?? candidate.dongOrStation,
    phones,
    emails,
    logoUrl: existing.logoUrl ?? candidate.logoUrl,
    gallery,
    externalProfileUrl: existing.externalProfileUrl ?? candidate.externalProfileUrl,
  };
}

function mergeGallery(existing: AcademyGalleryImage[], incoming: AcademyGalleryImage[]): AcademyGalleryImage[] {
  const byUrl = new Map<string, AcademyGalleryImage>();
  for (const image of [...existing, ...incoming]) {
    if (!byUrl.has(image.url)) byUrl.set(image.url, image);
  }
  return [...byUrl.values()].sort((a, b) => a.order - b.order);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

export function normalizeOrganizationName(name: string): string {
  return name
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\s·•・]+/g, "")
    .replace(/[()[\]{}「」『』"'`]/g, "")
    .replace(/(주식회사|㈜|\(주\)|유한회사)/g, "");
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function mapCompanyType(companyType: string | null | undefined): OrganizationType {
  if (!companyType) return "UNKNOWN";
  const trimmed = companyType.trim();
  if (trimmed === "무용학원" || trimmed === "학원") return "ACADEMY";
  if (trimmed === "파견회사" || trimmed === "파견") return "DISPATCH_AGENCY";
  return "UNKNOWN";
}

export function buildOrganizationMatchKey(input: {
  normalizedName: string;
  sido?: string | null;
  sigungu?: string | null;
  externalProfileUrl?: string | null;
  phones?: string[];
}): string {
  if (input.externalProfileUrl) {
    return `profile:${input.externalProfileUrl.trim()}`;
  }
  const phones = (input.phones ?? []).map(normalizePhone).filter((phone) => phone.length >= 8);
  if (phones.length > 0) {
    return `phone:${[...phones].sort()[0]}`;
  }
  return ["name", input.normalizedName, input.sido ?? "", input.sigungu ?? ""].join("|");
}

const SHORT_CITY_NAMES = new Set([
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "수원",
  "성남",
  "고양",
  "용인",
  "부천",
  "안산",
  "안양",
  "남양주",
  "화성",
  "평택",
  "의정부",
  "시흥",
  "파주",
  "김포",
  "광명",
  "군포",
  "하남",
  "오산",
  "이천",
  "안성",
  "의왕",
  "구리",
  "동두천",
  "과천",
  "여주",
  "양주",
  "포천",
  "청주",
  "천안",
  "전주",
  "포항",
  "창원",
]);

function isRegionToken(token: string): boolean {
  if (SHORT_CITY_NAMES.has(token)) return true;
  if (
    /^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주|전국|전지역)$/.test(
      token,
    )
  ) {
    return true;
  }
  if (/(?:특별시|광역시|특별자치시|특별자치도)$/.test(token)) return true;
  // 행정구역 접미사. '시'는 상호명(리클래시 등)과 겹치므로 짧은 지명만 허용.
  if (/^[가-힣]{1,3}(군|구)$/.test(token)) return true;
  if (/^[가-힣]{1,2}시$/.test(token)) return true;
  if (/^(남양주|의정부|동두천|영등포|서대문|동대문|남대문)시$/.test(token)) return true;
  if (/^[가-힣0-9]{1,6}(동|읍|면|리|역)$/.test(token)) return true;
  return false;
}

function hasInstitutionKeyword(token: string): boolean {
  return /(무용학원|발레학원|아카데미|스튜디오|교육원|학원)/.test(token);
}

export function cleanOrganizationDisplayName(value: string): string | null {
  let name = value.replace(/\s+/g, " ").trim();
  if (!name) return null;

  // 전체를 감싼 괄호 제거: "(예종앙볼리발레학원)"
  if (/^[(\[{].+[)\]}]$/.test(name)) {
    name = name.slice(1, -1).trim();
  }

  // "부천 상동 온디느무용학원 (역 1분)" → 괄호 설명 제거
  name = name.replace(/\s*\([^)]*(역|거리|분|근처|인근)[^)]*\)\s*$/g, "").trim();
  if (!name) return null;

  const tokens = name.split(" ").filter(Boolean);
  const institutionIdx = tokens.findIndex((token) => hasInstitutionKeyword(token));
  if (institutionIdx >= 0) {
    let start = institutionIdx;
    while (start > 0 && !isRegionToken(tokens[start - 1]!)) {
      start -= 1;
    }
    name = tokens.slice(start).join(" ").trim();
  } else {
    while (tokens.length > 1 && isRegionToken(tokens[0]!)) {
      tokens.shift();
    }
    name = tokens.join(" ").trim();
  }

  return name || null;
}

export function looksLikeOrganizationName(
  value: string,
  options: { allowShortBrand?: boolean } = {},
): boolean {
  const name = value.trim().replace(/^[(\[]|[)\]]$/g, "");
  if (name.length < 2) return false;
  if (/^[A-Za-z0-9_]{2,12}$/.test(name)) return false; // 닉네임성
  if (isRegionToken(name)) return false;
  if (name.split(/\s+/).every((token) => isRegionToken(token))) return false;
  if (
    /(도보\s*\d|\d+\s*분|분거리|인근|부근|모집|구인|시급|급여|수업)/.test(name) &&
    !/(학원|아카데미|스튜디오)/.test(name)
  ) {
    return false;
  }
  // 학원/회사 키워드가 있으면 수용
  if (/학원|발레|ballet|스튜디오|studio|아카데미|academy|무용|교육|댄스|dance|필라테스|pilates|파견|주식회사|㈜/i.test(name)) {
    return true;
  }
  // 키워드 없는 짧은 한글: balletmania company / 학원명·회사 섹션에서만 허용
  if (/^[가-힣]{2,6}$/.test(name)) return Boolean(options.allowShortBrand);
  // 영문 상호
  if (/^[A-Za-z][A-Za-z0-9 .&'-]{2,}$/.test(name)) return true;
  // 그 외 상호(영문+한글 혼합 등)
  return /[가-힣]{2,}/.test(name) && !/^(작성자|닉네임|회원)/.test(name);
}

export function extractAcademyNameFromDisplaySections(
  sections: Array<{ title?: string | null; content?: string | null }> | null | undefined,
): string | null {
  if (!sections) return null;

  const prioritized: Array<{ title: string; content: string; rank: number }> = [];
  for (const section of sections) {
    if (!section || typeof section.title !== "string" || typeof section.content !== "string") continue;
    const title = section.title.trim();
    const content = section.content.trim();
    if (!content) continue;

    let rank = -1;
    if (title === "학원명" || title.startsWith("학원명")) rank = 0;
    else if (title === "회사") rank = 1;
    else if (title === "업체명" || title === "업체") rank = 2;
    if (rank < 0) continue;

    prioritized.push({ title, content, rank });
  }

  prioritized.sort((a, b) => a.rank - b.rank);
  for (const item of prioritized) {
    const cleaned = cleanOrganizationDisplayName(item.content);
    if (!cleaned) continue;
    const allowShortBrand = item.rank <= 1; // 학원명/회사만 짧은 상호 허용, 업체명은 불인정
    if (!looksLikeOrganizationName(cleaned, { allowShortBrand })) continue;
    return cleaned;
  }
  return null;
}

export function resolveOrganizationName(input: {
  source: string;
  company?: string | null;
  displaySections?: Array<{ title?: string | null; content?: string | null }> | null;
}): string | null {
  const fromSections = extractAcademyNameFromDisplaySections(input.displaySections);
  if (fromSections) return fromSections;

  const company = typeof input.company === "string" ? input.company.trim() : "";
  if (!company) return null;

  const cleaned = cleanOrganizationDisplayName(company);
  if (!cleaned) return null;

  // esangdance raw.company는 작성자명인 경우가 많아 짧은 상호 fallback을 막는다.
  if (input.source === "esangdance") {
    return looksLikeOrganizationName(cleaned, { allowShortBrand: false }) ? cleaned : null;
  }

  // balletmania company는 짧은 브랜드명을 허용하되 지역/거리 문구는 거절한다.
  return looksLikeOrganizationName(cleaned, { allowShortBrand: true }) ? cleaned : null;
}
