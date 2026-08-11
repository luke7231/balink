import type { JobPost, JobPostSource, Organization, SourcePost, SubstitutePost } from "@prisma/client";
import {
  jsonArray,
  jsonValue,
  type AcademyGalleryImage,
  type DisplaySection,
  type JobPostDetail,
  type JobPostSourceLink,
  type JobPostSummary,
  type LocationSource,
  type OrganizationDetail,
  type OrganizationSummary,
  type OrganizationType,
  type RepresentativePay,
  type SourceName,
  type SourcePostSummary,
  type SubstitutePostDetail,
  type SubstitutePostStatus,
  type SubstitutePostSummary,
  type SubstituteRecurrence,
  type SubstituteScheduleKind,
  type SubstituteSession,
  type SubstituteTimeSlot,
  type SubstituteUrgency,
  isAcademyPlaceholderImageUrl,
  pickAcademyThumbnail,
} from "@balink/domain";

type JobPostWithSources = JobPost & {
  organization?: Organization | null;
  jobPostSources: (JobPostSource & {
    sourcePost: Pick<SourcePost, "id" | "sourcePostId" | "sourceUrl" | "title" | "postedAt">;
  })[];
};

export function toJobPostSummary(job: JobPost): JobPostSummary {
  const thumbnail = pickAcademyThumbnail(
    parseAcademyGallery(job.academyGalleryJson),
    job.academyLogoUrl,
  );

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
    dayGroups: parseDayGroups(job.dayGroups),
    timeSlots: jsonArray(job.timeSlots),
    times: jsonArray(job.times),
    payText: job.payText,
    payMinManwon: job.payMinManwon,
    payMaxManwon: job.payMaxManwon,
    payNegotiable: job.payNegotiable,
    representativePayText: job.representativePayText,
    academyThumbnailUrl: thumbnail?.url ?? null,
    academyThumbnailType: thumbnail?.type ?? null,
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
    displaySections: parseDisplaySections(job.displaySectionsJson),
    representativePay: parseRepresentativePay(job.representativePayJson),
    locationSource: (job.locationSource as LocationSource | null) ?? null,
    academyLogoUrl: isAcademyPlaceholderImageUrl(job.academyLogoUrl) ? null : job.academyLogoUrl,
    academyGallery: parseAcademyGallery(job.academyGalleryJson),
    organization: job.organization ? toOrganizationSummary(job.organization) : null,
  };
}

export function toOrganizationSummary(org: Organization): OrganizationSummary {
  return {
    id: org.id,
    name: org.name,
    type: org.type as OrganizationType,
    sido: org.sido,
    sigungu: org.sigungu,
    dongOrStation: org.dongOrStation,
    logoUrl: isAcademyPlaceholderImageUrl(org.logoUrl) ? null : org.logoUrl,
    externalProfileUrl: org.externalProfileUrl,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
  };
}

export function toOrganizationDetail(
  org: Organization & { jobPosts: JobPost[] },
): OrganizationDetail {
  return {
    ...toOrganizationSummary(org),
    phones: jsonArray(org.phonesJson),
    emails: jsonArray(org.emailsJson),
    gallery: parseAcademyGallery(org.galleryJson),
    jobPosts: org.jobPosts.map(toJobPostSummary),
    jobPostCount: org.jobPosts.length,
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
    status: run.status as import("@balink/domain").ScraperRunStatus,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    collected: run.collected,
    classified: run.classified,
    imported: run.imported,
    errorMessage: run.errorMessage,
  };
}

function parseDisplaySections(value: unknown): DisplaySection[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is DisplaySection =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as DisplaySection).title === "string" &&
      typeof (item as DisplaySection).content === "string",
  );
}

function parseRepresentativePay(value: unknown): RepresentativePay | null {
  if (!value || typeof value !== "object") return null;
  const pay = value as RepresentativePay;
  if (typeof pay.unit !== "string" || typeof pay.displayText !== "string") return null;
  return pay;
}

function parseAcademyGallery(value: unknown): AcademyGalleryImage[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is AcademyGalleryImage =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as AcademyGalleryImage).type === "string" &&
      typeof (item as AcademyGalleryImage).order === "number" &&
      typeof (item as AcademyGalleryImage).url === "string" &&
      !isAcademyPlaceholderImageUrl((item as AcademyGalleryImage).url) &&
      !isAcademyPlaceholderImageUrl((item as AcademyGalleryImage).sourceUrl),
  );
}

export function toSubstitutePostSummary(post: SubstitutePost): SubstitutePostSummary {
  return {
    id: post.id,
    source: post.source as SourceName,
    sourceUrl: post.sourceUrl,
    title: post.title,
    summary: post.summary,
    author: post.author,
    postedAt: post.postedAt,
    scheduleKind: (post.scheduleKind as SubstituteScheduleKind) || "unscheduled",
    sessions: parseSessions(post.sessionsJson),
    recurrence: parseRecurrence(post.recurrenceJson),
    lessonDates: jsonArray(post.lessonDatesJson),
    timeSlots: parseTimeSlots(post.timeSlotsJson),
    audienceTypes: jsonArray(post.audienceTypes),
    subjectTypes: jsonArray(post.subjectTypes),
    locationText: post.locationText,
    sido: post.sido,
    sigungu: post.sigungu,
    dongOrStation: post.dongOrStation,
    payText: post.payText,
    representativePayText: post.representativePayText,
    academyName: post.academyName,
    urgency: (post.urgency as SubstituteUrgency | null) ?? null,
    status: post.status as SubstitutePostStatus,
    nextLessonAt: post.nextLessonAt,
    expiresAt: post.expiresAt,
    recommendCount: post.recommendCount,
    viewCount: post.viewCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export function toSubstitutePostDetail(post: SubstitutePost): SubstitutePostDetail {
  return {
    ...toSubstitutePostSummary(post),
    body: post.body,
    requirements: jsonArray(post.requirementsJson),
    applicationInstructions: post.applicationInstructions,
    notes: jsonArray(post.notesJson),
    representativePay: parseRepresentativePay(post.representativePayJson),
    contactMethods: jsonArray(post.contactMethodsJson),
    contactEmails: jsonArray(post.contactEmailsJson),
    contactPhones: jsonArray(post.contactPhonesJson),
    classification: jsonValue(post.classificationJson),
  };
}

function parseSessions(value: unknown): SubstituteSession[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is SubstituteSession => Boolean(item) && typeof item === "object");
}

function parseRecurrence(value: unknown): SubstituteRecurrence | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as SubstituteRecurrence;
}

function parseTimeSlots(value: unknown): SubstituteTimeSlot[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is SubstituteTimeSlot =>
      Boolean(item) &&
      typeof item === "object" &&
      ("start" in (item as SubstituteTimeSlot) || "end" in (item as SubstituteTimeSlot) || "raw" in (item as SubstituteTimeSlot)),
  );
}

function parseDayGroups(value: unknown): string[][] {
  if (!Array.isArray(value)) return [];
  return value
    .map((group) =>
      Array.isArray(group)
        ? group.filter((day): day is string => typeof day === "string")
        : [],
    )
    .filter((group) => group.length > 0);
}
