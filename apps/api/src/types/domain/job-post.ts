import type { JobPost, JobPostSource, SourcePost } from "@prisma/client";
import { jsonArray, jsonValue } from "../../lib/json.js";
import type { SourceName } from "./enums.js";

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
}

type JobPostWithSources = JobPost & {
  jobPostSources: (JobPostSource & {
    sourcePost: Pick<SourcePost, "id" | "sourcePostId" | "sourceUrl" | "title" | "postedAt">;
  })[];
};

export function toJobPostSummary(job: JobPost): JobPostSummary {
  return {
    id: job.id,
    title: job.title,
    sourcePrimary: job.sourcePrimary as SourceName,
    jobType: job.jobType,
    postedAt: job.postedAt,
    locationText: job.locationText,
    sido: job.sido,
    sigungu: job.sigungu,
    dongOrStation: job.dongOrStation,
    audienceTypes: jsonArray(job.audienceTypes),
    subjectTypes: jsonArray(job.subjectTypes),
    days: jsonArray(job.days),
    timeSlots: jsonArray(job.timeSlots),
    times: jsonArray(job.times),
    payText: job.payText,
    payMinManwon: job.payMinManwon,
    payMaxManwon: job.payMaxManwon,
    payNegotiable: job.payNegotiable,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export function toJobPostDetail(job: JobPostWithSources): JobPostDetail {
  return {
    ...toJobPostSummary(job),
    description: job.description,
    status: job.status,
    isBallet: job.isBallet,
    balletConfidence: job.balletConfidence,
    classCount: job.classCount,
    durationMinutes: job.durationMinutes,
    payType: job.payType,
    contactMethods: jsonArray(job.contactMethods),
    contactEmails: jsonArray(job.contactEmails),
    contactPhones: jsonArray(job.contactPhones),
    requirements: jsonValue(job.requirementsJson),
    confidence: jsonValue(job.confidenceJson),
  };
}

export function toJobPostSourceLink(link: JobPostSource & { sourcePost: SourcePostSummary }): JobPostSourceLink {
  return {
    id: link.id,
    source: link.source as SourceName,
    sourceUrl: link.sourceUrl,
    confidence: link.confidence,
    sourcePost: link.sourcePost,
  };
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
