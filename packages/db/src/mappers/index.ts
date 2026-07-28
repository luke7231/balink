import type { JobPost, JobPostSource, SourcePost } from "@prisma/client";
import {
  jsonArray,
  jsonValue,
  type JobPostDetail,
  type JobPostSourceLink,
  type JobPostSummary,
  type SourceName,
  type SourcePostSummary,
} from "@black-swan/domain";

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

export function toScraperRunSummary(run: import("@prisma/client").ScraperRun) {
  return {
    id: run.id,
    source: run.source as SourceName | null,
    targetDate: run.targetDate,
    llmMode: run.llmMode,
    status: run.status as import("@black-swan/domain").ScraperRunStatus,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    collected: run.collected,
    classified: run.classified,
    imported: run.imported,
    errorMessage: run.errorMessage,
  };
}
