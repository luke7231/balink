import { createHash } from "node:crypto";
import type { SourceName } from "@balink/domain";
import {
  SUBSTITUTE_NORMALIZATION_VERSION,
  canonicalizeAdminRegion,
  deriveSubstituteSchedule,
  deriveSubstituteStatus,
  formatRepresentativePayDisplay,
  sanitizeLocationTextForStorage,
} from "@balink/domain";
import { SubstitutePostRepository } from "@balink/db";
import { enqueueAnonymousUrgentPush } from "./anonymous-push.js";
import type { FormattedSubstitutePost } from "./substitute-formatter.js";
import { fanOutSubstituteMatch, shouldFanOutInbox } from "./notification-fanout.js";

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
  /** true일 때만 신규 대타 알림함 fan-out. 백필/재처리는 false(기본). */
  fanOutInbox?: boolean;
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
  const location = canonicalizeAdminRegion({
    sido: input.formatted.location.sido,
    sigungu: input.formatted.location.sigungu,
    dongOrStation: input.formatted.location.dongOrStation,
  });

  const { post, created } = await substitutePostRepository.upsert({
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
      location.sido,
      location.sigungu,
      location.dongOrStation,
    ),
    sido: location.sido,
    sigungu: location.sigungu,
    dongOrStation: location.dongOrStation,
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

  if (shouldFanOutInbox({ created, fanOutInbox: input.fanOutInbox })) {
    try {
      await fanOutSubstituteMatch(post);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[substitute-import] fanOutInbox failed substitutePostId=${post.id}: ${message}`);
    }
    try {
      await enqueueAnonymousUrgentPush(post);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[substitute-import] anonymous push failed substitutePostId=${post.id}: ${message}`);
    }
  }

  return post;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
