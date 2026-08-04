import { createHash } from "node:crypto";
import type { SourceName } from "@black-swan/domain";
import {
  SUBSTITUTE_NORMALIZATION_VERSION,
  deriveSubstituteSchedule,
  deriveSubstituteStatus,
  formatRepresentativePayDisplay,
  sanitizeLocationTextForStorage,
} from "@black-swan/domain";
import { SubstitutePostRepository } from "@black-swan/db";
import type { FormattedSubstitutePost } from "./substitute-formatter.js";

const substitutePostRepository = new SubstitutePostRepository();

export interface SubstituteRawRecord {
  title: string;
  detailText: string | null;
  author: string | null;
  authorMemberNo: string | null;
  postedDate: string | null;
  postedAtIso: string | null;
  contactPhones: string[];
  contactEmails: string[];
  recommendCount: number;
  viewCount: number;
}

export interface PersistSubstituteInput {
  source: SourceName;
  sourcePostId: string;
  sourceUrl: string;
  collectedAt: string;
  raw: SubstituteRawRecord;
  formatted: FormattedSubstitutePost;
  contentHash: string;
}

export function hashSubstituteContent(title: string, detailText: string | null): string {
  return createHash("sha256")
    .update([title, detailText ?? ""].join("\n"))
    .digest("hex");
}

export function hashSubstituteContentFromRaw(raw: Record<string, unknown>): string {
  return hashSubstituteContent(stringValue(raw.title) || "", stringValue(raw.detailText));
}

export async function persistNormalizedSubstitute(input: PersistSubstituteInput) {
  const postedAt = parseDate(input.raw.postedAtIso || input.raw.postedDate);
  const derived = deriveSubstituteSchedule({
    title: input.raw.title,
    postedAt,
    sessions: input.formatted.sessions,
    recurrence: input.formatted.recurrence,
  });
  const status = deriveSubstituteStatus({ expiresAt: derived.expiresAt });
  const contactMethods = [
    ...(input.raw.contactPhones.length ? ["phone"] : []),
    ...(input.raw.contactEmails.length ? ["email"] : []),
  ];

  return substitutePostRepository.upsert({
    source: input.source,
    sourcePostId: input.sourcePostId,
    sourceUrl: input.sourceUrl,
    title: input.raw.title,
    summary: input.formatted.summary,
    body: input.raw.detailText,
    author: input.raw.author,
    authorMemberNo: input.raw.authorMemberNo,
    postedAt,
    sessions: derived.sessions,
    recurrence: derived.recurrence,
    scheduleKind: derived.scheduleKind,
    lessonDates: derived.lessonDates,
    timeSlots: derived.timeSlots,
    audienceTypes: derived.audienceTypes.length ? derived.audienceTypes : ["unknown"],
    subjectTypes: derived.subjectTypes.length ? derived.subjectTypes : ["unknown"],
    locationText: sanitizeLocationTextForStorage(
      input.formatted.location.locationText,
      input.formatted.location.sido,
      input.formatted.location.sigungu,
      input.formatted.location.dongOrStation,
    ),
    sido: input.formatted.location.sido,
    sigungu: input.formatted.location.sigungu,
    dongOrStation: input.formatted.location.dongOrStation,
    payText: input.formatted.representativePay.displayText,
    representativePay: input.formatted.representativePay,
    representativePayText: formatRepresentativePayDisplay(input.formatted.representativePay),
    academyName: input.formatted.academyName,
    requirements: input.formatted.requirements,
    applicationInstructions: input.formatted.applicationInstructions,
    notes: input.formatted.notes,
    contactMethods,
    contactEmails: input.raw.contactEmails,
    contactPhones: input.raw.contactPhones,
    urgency: derived.urgency,
    status,
    nextLessonAt: derived.nextLessonAt,
    expiresAt: derived.expiresAt,
    recommendCount: input.raw.recommendCount,
    viewCount: input.raw.viewCount,
    raw: input.raw as unknown as Record<string, unknown>,
    classification: {
      summary: input.formatted.summary,
      location: input.formatted.location,
      sessions: derived.sessions,
      recurrence: derived.recurrence,
      representativePay: input.formatted.representativePay,
      academyName: input.formatted.academyName,
      requirements: input.formatted.requirements,
      applicationInstructions: input.formatted.applicationInstructions,
      notes: input.formatted.notes,
      model: input.formatted.model,
    },
    contentHash: input.contentHash,
    normalizationVersion: SUBSTITUTE_NORMALIZATION_VERSION,
    normalizedAt: new Date(input.collectedAt),
    lastSeenAt: new Date(input.collectedAt),
  });
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
