import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import type { Prisma, PrismaSourceName } from "@balink/db";
import { SourcePostRepository } from "@balink/db";
import type { ListingEnrichment, LocationSource, SourceName } from "@balink/domain";
import { sanitizeLocationTextForStorage, sanitizeSchedule } from "@balink/domain";
import { classifiedPayloadSchema, parseOrThrow } from "@balink/validation";
import { mirrorAcademyImagesToS3, parseRawAcademyImages } from "./academy-images.js";
import { fanOutJobMatch, shouldFanOutInbox } from "./notification-fanout.js";
import { buildOrganizationCandidate } from "./organization-matching.js";

const sourcePostRepository = new SourcePostRepository();

interface ImportResult {
  imported: number;
}

export interface ImportClassifiedOptions {
  /** true일 때만 신규 JobPost 알림함 fan-out. 백필/재처리는 false(기본). */
  fanOutInbox?: boolean;
}

interface ClassifiedListingInput {
  sourcePostId: string;
  url: string;
  collectedAt: string;
  raw: Record<string, unknown>;
  classification: Record<string, unknown>;
  enrichment?: ListingEnrichment;
}

export async function importClassifiedFile(
  filePath: string,
  options: ImportClassifiedOptions = {},
): Promise<ImportResult> {
  const rawPayload = JSON.parse(await fs.readFile(filePath, "utf8"));
  const payload = parseOrThrow(classifiedPayloadSchema, rawPayload, "Invalid classified payload");
  let imported = 0;

  for (const item of payload.listings) {
    await importClassifiedItem(payload.source, item as ClassifiedListingInput, options);
    imported += 1;
  }

  return { imported };
}

async function importClassifiedItem(
  source: SourceName,
  item: ClassifiedListingInput,
  options: ImportClassifiedOptions = {},
): Promise<void> {
  const normalized = await normalizeItem(source, item);
  const organizationCandidate = buildOrganizationCandidate({
    source,
    company: stringValue(item.raw.company),
    companyType: stringValue(item.raw.companyType),
    displaySections: item.enrichment?.displaySections ?? null,
    sido: normalized.jobPostData.sido ?? null,
    sigungu: normalized.jobPostData.sigungu ?? null,
    dongOrStation: normalized.jobPostData.dongOrStation ?? null,
    phones: item.enrichment
      ? normalized.jobPostData.contactPhones
      : asRecord(item.classification.contact).phones,
    emails: item.enrichment
      ? normalized.jobPostData.contactEmails
      : asRecord(item.classification.contact).emails,
    logoUrl: normalized.jobPostData.academyLogoUrl ?? null,
    gallery: normalized.jobPostData.academyGalleryJson,
    academyImages: item.raw.academyImages,
  });
  const result = await sourcePostRepository.importClassifiedItem({
    source,
    sourcePostId: item.sourcePostId,
    url: item.url,
    collectedAt: item.collectedAt,
    raw: item.raw,
    classification: item.classification,
    organizationCandidate,
    normalized,
  });

  if (!shouldFanOutInbox({ created: result.created, fanOutInbox: options.fanOutInbox })) {
    return;
  }

  try {
    await fanOutJobMatch(result.jobPost);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[import-classified] fanOutInbox failed jobPostId=${result.jobPostId}: ${message}`);
  }
}

async function normalizeItem(source: SourceName, item: ClassifiedListingInput) {
  const raw = item.raw;
  const classification = item.classification;
  const enrichment = item.enrichment;
  const location = enrichment?.location ?? firstObject(classification.locations);
  const title = stringValue(raw.title) || "Untitled job post";
  const description = stringValue(raw.detailText);
  const schedule = sanitizeSchedule(asRecord(classification.schedule) as never, {
    title,
    detailText: description,
  });
  const pay = asRecord(classification.pay);
  const contact = asRecord(classification.contact);
  const requirements = asRecord(classification.requirements);
  const llm = asRecord(classification.llm);
  const representativePay = enrichment?.representativePay ?? null;
  const academyImages = await mirrorAcademyImagesToS3(
    source,
    item.sourcePostId,
    parseRawAcademyImages(raw.academyImages),
  );
  const contentHash = hashContent([source, title, description, stringValue(raw.postedDate)].join("\n"));

  const confidenceJson = {
    ...llm,
    formatting: enrichment?.meta ?? null,
    locationSource: enrichment?.location.source ?? null,
    locationConfidence: enrichment?.location.confidence ?? null,
    representativePayConfidence: representativePay?.confidence ?? null,
  };

  const normalizedJson = {
    source,
    sourcePostId: item.sourcePostId,
    sourceUrl: item.url,
    title,
    description,
    raw,
    classification,
    enrichment,
  };

  const normalizedSido = stringValue(location.sido);
  const normalizedSigungu = stringValue(location.sigungu);
  const normalizedDong = stringValue(location.dongOrStation);

  return {
    title,
    postedAt: parseDate(stringValue(raw.postedDate)),
    contentHash,
    sourceConfidence: stringValue(classification.balletConfidence),
    jobPostData: {
      title,
      description,
      sourcePrimary: source as PrismaSourceName,
      status: stringValue(raw.status),
      postedAt: parseDate(stringValue(raw.postedDate)),
      jobType: stringValue(classification.jobType),
      isBallet: Boolean(classification.isBallet),
      balletConfidence: stringValue(classification.balletConfidence),
      audienceTypes: jsonArray(classification.audiences),
      subjectTypes: jsonArray(classification.subjects),
      locationText: sanitizeLocationTextForStorage(
        stringValue((location as Record<string, unknown>).locationText) ||
          stringValue((location as Record<string, unknown>).raw) ||
          stringValue(raw.summaryRegionText),
        normalizedSido,
        normalizedSigungu,
        normalizedDong,
      ),
      sido: normalizedSido,
      sigungu: normalizedSigungu,
      dongOrStation: normalizedDong,
      days: schedule.days,
      dayGroups: schedule.dayGroups as unknown as Prisma.InputJsonValue,
      timeSlots: schedule.timeSlots,
      times: schedule.times as unknown as Prisma.InputJsonValue,
      classCount: schedule.classCount,
      durationMinutes: schedule.durationMinutes,
      payType: stringValue(pay.type),
      payMinManwon: numberValue(pay.minManwon),
      payMaxManwon: numberValue(pay.maxManwon),
      payText: stringValue(pay.amountText),
      payNegotiable: Boolean(pay.isNegotiable),
      displaySectionsJson: jsonValue(enrichment?.displaySections ?? []),
      representativePayUnit: representativePay?.unit ?? null,
      representativePayText: representativePay?.displayText ?? null,
      representativePayMinManwon: representativePay?.minManwon ?? null,
      representativePayMaxManwon: representativePay?.maxManwon ?? null,
      representativePayJson: jsonValue(representativePay),
      locationSource: (enrichment?.location.source as LocationSource | undefined) ?? null,
      academyLogoUrl: academyImages?.logoUrl ?? null,
      academyGalleryJson: jsonValue(academyImages?.gallery ?? []),
      contactMethods: jsonArray(contact.applyMethods),
      contactEmails: jsonArray(contact.emails),
      contactPhones: jsonArray(contact.phones),
      requirementsJson: requirements as Prisma.InputJsonValue,
      confidenceJson: confidenceJson as Prisma.InputJsonValue,
      normalizedJson: normalizedJson as Prisma.InputJsonValue,
      contentHash,
    },
  };
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hashContent(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function firstObject(value: unknown): Record<string, unknown> {
  if (!Array.isArray(value)) return asRecord(value);
  return asRecord(value[0]);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function jsonArray(value: unknown): Prisma.InputJsonValue {
  return Array.isArray(value) ? (value as Prisma.InputJsonValue) : [];
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return (value ?? null) as Prisma.InputJsonValue;
}
