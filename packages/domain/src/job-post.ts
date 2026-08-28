import type { SourceName } from "./enums.js";
import type { AcademyGalleryImage, AcademyGalleryImageType } from "./academy-images.js";
import type { DisplaySection, LocationSource, RepresentativePay } from "./formatted-post.js";
import type { OrganizationSummary } from "./organization.js";

export interface JobPostFilterInput {
  sido?: string | null;
  sigungu?: string | null;
  jobType?: string | null;
  source?: SourceName | null;
  /** Keyword search (title, location, organization name). */
  q?: string | null;
}

/** Trim, collapse spaces, cap length. Empty → "". */
export function normalizeJobSearchQuery(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 40);
}

export interface SourcePostSummary {
  id: string;
  sourcePostId: string;
  title: string;
  sourceUrl: string;
  postedAt: Date | null;
}

export interface JobPostSourceLink {
  id: string;
  source: SourceName;
  sourceUrl: string;
  confidence: string | null;
  sourcePost: SourcePostSummary;
}

export interface JobPostSummary {
  id: string;
  title: string;
  sourcePrimary: SourceName;
  jobType: string | null;
  postedAt: Date | null;
  locationText: string | null;
  sido: string | null;
  sigungu: string | null;
  dongOrStation: string | null;
  audienceTypes: string[];
  subjectTypes: string[];
  days: string[];
  dayGroups: string[][];
  timeSlots: string[];
  times: string[];
  payText: string | null;
  payMinManwon: number | null;
  payMaxManwon: number | null;
  payNegotiable: boolean;
  representativePayText: string | null;
  academyThumbnailUrl: string | null;
  academyThumbnailType: AcademyGalleryImageType | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobPostDetail extends JobPostSummary {
  description: string | null;
  status: string | null;
  isBallet: boolean;
  balletConfidence: string | null;
  classCount: number | null;
  durationMinutes: number | null;
  payType: string | null;
  contactMethods: string[];
  contactEmails: string[];
  contactPhones: string[];
  requirements: unknown;
  confidence: unknown;
  displaySections: DisplaySection[];
  representativePay: RepresentativePay | null;
  locationSource: LocationSource | null;
  academyLogoUrl: string | null;
  academyGallery: AcademyGalleryImage[];
  organization: OrganizationSummary | null;
}

export interface JobRegionCount {
  sigungu: string;
  count: number;
}

export interface JobRegionGroup {
  sido: string;
  districts: JobRegionCount[];
}

export function groupJobRegions(
  rows: Array<{ sido: string | null; sigungu: string | null; _count: { _all: number } }>,
): JobRegionGroup[] {
  const grouped = new Map<string, JobRegionCount[]>();

  for (const row of rows) {
    if (!row.sido || !row.sigungu) continue;
    const districts = grouped.get(row.sido) ?? [];
    districts.push({ sigungu: row.sigungu, count: row._count._all });
    grouped.set(row.sido, districts);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "ko"))
    .map(([sido, districts]) => ({
      sido,
      districts: districts.sort((a, b) => a.sigungu.localeCompare(b.sigungu, "ko")),
    }));
}
