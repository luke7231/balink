import type { SourceName } from "./enums.js";
import type { DisplaySection, LocationSource, RepresentativePay } from "./formatted-post.js";

export interface JobPostFilterInput {
  sido?: string | null;
  sigungu?: string | null;
  jobType?: string | null;
  source?: SourceName | null;
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
  timeSlots: string[];
  times: string[];
  payText: string | null;
  payMinManwon: number | null;
  payMaxManwon: number | null;
  payNegotiable: boolean;
  representativePayText: string | null;
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
