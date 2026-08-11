import type {
  AcademyGalleryImage,
  OrganizationCandidate,
  OrganizationExisting,
  OrganizationMatchDecision,
  SourceName,
} from "@balink/domain";
import {
  buildOrganizationMatchKey,
  decideOrganizationMatch,
  mapCompanyType,
  mergeOrganizationFields,
  normalizeEmail,
  normalizeOrganizationName,
  normalizePhone,
  resolveOrganizationName,
} from "@balink/domain";

export type { OrganizationExisting, OrganizationMatchDecision };

export interface BuildOrganizationCandidateInput {
  source: SourceName | string;
  company?: string | null;
  companyType?: string | null;
  displaySections?: Array<{ title?: string | null; content?: string | null }> | null;
  sido?: string | null;
  sigungu?: string | null;
  dongOrStation?: string | null;
  phones?: unknown;
  emails?: unknown;
  logoUrl?: string | null;
  gallery?: unknown;
  externalProfileUrl?: string | null;
  academyImages?: unknown;
}

export function buildOrganizationCandidate(
  input: BuildOrganizationCandidateInput,
): OrganizationCandidate | null {
  const name = resolveOrganizationName({
    source: input.source,
    company: input.company,
    displaySections: input.displaySections,
  });
  if (!name) return null;

  const normalizedName = normalizeOrganizationName(name);
  if (!normalizedName) return null;

  const phones = uniqueStrings(asStringArray(input.phones).map(normalizePhone).filter((p) => p.length >= 8));
  const emails = uniqueStrings(asStringArray(input.emails).map(normalizeEmail).filter(Boolean));
  const externalProfileUrl =
    stringValue(input.externalProfileUrl) ??
    extractCompanyProfileUrl(input.academyImages);
  const gallery = parseGallery(input.gallery);
  const logoUrl = stringValue(input.logoUrl);
  const type = mapCompanyType(input.companyType);
  const sido = stringValue(input.sido);
  const sigungu = stringValue(input.sigungu);
  const dongOrStation = stringValue(input.dongOrStation);
  const matchKey = buildOrganizationMatchKey({
    normalizedName,
    sido,
    sigungu,
    externalProfileUrl,
    phones,
  });

  const evidence: string[] = [`name:${name}`];
  if (externalProfileUrl) evidence.push(`profile:${externalProfileUrl}`);
  if (phones[0]) evidence.push(`phone:${phones[0]}`);
  if (sido || sigungu) evidence.push(`region:${[sido, sigungu].filter(Boolean).join(" ")}`);

  return {
    name,
    normalizedName,
    type,
    matchKey,
    sido,
    sigungu,
    dongOrStation,
    phones,
    emails,
    logoUrl,
    gallery,
    externalProfileUrl,
    evidence,
  };
}

export { decideOrganizationMatch, mergeOrganizationFields };

function extractCompanyProfileUrl(academyImages: unknown): string | null {
  if (!academyImages || typeof academyImages !== "object" || Array.isArray(academyImages)) return null;
  return stringValue((academyImages as Record<string, unknown>).companyProfileUrl);
}

function parseGallery(value: unknown): AcademyGalleryImage[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is AcademyGalleryImage =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as AcademyGalleryImage).type === "string" &&
      typeof (item as AcademyGalleryImage).order === "number" &&
      typeof (item as AcademyGalleryImage).url === "string",
  );
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
