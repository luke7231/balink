import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import type { Prisma, PrismaSourceName } from "@balink/db";
import { SourcePostRepository, SubstitutePostRepository } from "@balink/db";
import type { ListingEnrichment, LocationSource, SourceName } from "@balink/domain";
import {
  canonicalizeAdminRegion,
  sanitizeLocationTextForStorage,
  sanitizeSchedule,
  shouldRouteEmployListingToSubstitute,
  toEmploySubstituteSourcePostId,
} from "@balink/domain";
import { classifiedPayloadSchema, parseOrThrow } from "@balink/validation";
import { mirrorAcademyImagesToS3, parseRawAcademyImages } from "./academy-images.js";
import { fanOutJobMatch, shouldFanOutInbox } from "./notification-fanout.js";
import { buildOrganizationCandidate } from "./organization-matching.js";
import {
  hashSubstituteContent,
  persistNormalizedSubstitute,
  type SubstituteRawRecord,
} from "./substitute-import.js";
import { formatSubstitutePost, validateFormattedSubstitute } from "./substitute-formatter.js";

const sourcePostRepository = new SourcePostRepository();
const substitutePostRepository = new SubstitutePostRepository();

interface ImportResult {
  imported: number;
  routedToSubstitute: number;
}

export interface ImportClassifiedOptions {
  /** true일 때만 신규 JobPost/대강 알림함 fan-out. 백필/재처리는 false(기본). */
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
  let routedToSubstitute = 0;

  for (const item of payload.listings) {
    const routed = await importClassifiedItem(payload.source, item as ClassifiedListingInput, options);
    imported += 1;
    if (routed) routedToSubstitute += 1;
  }

  return { imported, routedToSubstitute };
}

async function importClassifiedItem(
  source: SourceName,
  item: ClassifiedListingInput,
  options: ImportClassifiedOptions = {},
): Promise<boolean> {
  const jobType = stringValue(item.classification.jobType);
  if (shouldRouteEmployListingToSubstitute(jobType)) {
    await importAsEmploySubstitute(source, item, options);
    return true;
  }

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
    return false;
  }

  try {
    const summary = await fanOutJobMatch(result.jobPost);
    console.info(
      `[import-classified] fanOutInbox jobPostId=${result.jobPostId} matched=${summary.matched} inserted=${summary.inserted}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[import-classified] fanOutInbox failed jobPostId=${result.jobPostId}: ${message}`);
  }
  return false;
}

async function importAsEmploySubstitute(
  source: SourceName,
  item: ClassifiedListingInput,
  options: ImportClassifiedOptions,
): Promise<void> {
  const title = stringValue(item.raw.title) || "Untitled substitute post";
  const detailText = stringValue(item.raw.detailText);
  const contentHash = hashContent([source, title, detailText ?? "", stringValue(item.raw.postedDate)].join("\n"));
  const postedAt = parseDate(stringValue(item.raw.postedDate));

  await sourcePostRepository.upsertSourcePostWithoutJob({
    source,
    sourcePostId: item.sourcePostId,
    url: item.url,
    title,
    postedAt,
    collectedAt: item.collectedAt,
    raw: item.raw,
    classification: item.classification,
    contentHash,
    sourceConfidence: stringValue(item.classification.balletConfidence),
  });

  const existingByUrl = await substitutePostRepository.findBySourceUrl(item.url);
  const substituteSource = existingByUrl?.source ?? source;
  const substituteSourcePostId =
    existingByUrl?.sourcePostId ?? toEmploySubstituteSourcePostId(item.sourcePostId);

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to route employ substitute listings");
  }

  const contact = asRecord(item.classification.contact);
  const contactPhones = stringArray(contact.phones);
  const contactEmails = stringArray(contact.emails);
  const rawRecord: SubstituteRawRecord = {
    title,
    detailText,
    author: stringValue(item.raw.company),
    authorMemberNo: null,
    postedDate: stringValue(item.raw.postedDate),
    postedAtIso: postedAt?.toISOString() ?? null,
    contactPhones,
    contactEmails,
    recommendCount: 0,
    viewCount: 0,
  };

  const formatted = await formatSubstitutePost({
    title,
    detailText: detailText ?? "",
    postedAt: rawRecord.postedAtIso,
  });
  validateFormattedSubstitute(formatted, `${title}\n${detailText ?? ""}`);

  await persistNormalizedSubstitute({
    source: substituteSource,
    sourcePostId: substituteSourcePostId,
    sourceUrl: item.url,
    collectedAt: item.collectedAt,
    raw: rawRecord,
    formatted,
    contentHash: hashSubstituteContent(title, detailText),
    fanOutInbox: options.fanOutInbox,
  });

  console.log(
    `[import-classified] routed employ substitute source=${source} sourcePostId=${item.sourcePostId} → ${substituteSource}:${substituteSourcePostId}`,
  );
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

  const canonicalLocation = canonicalizeAdminRegion({
    sido: stringValue(location.sido),
    sigungu: stringValue(location.sigungu),
    dongOrStation: stringValue(location.dongOrStation),
  });
  const normalizedSido = canonicalLocation.sido;
  const normalizedSigungu = canonicalLocation.sigungu;
  const normalizedDong = canonicalLocation.dongOrStation;

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

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
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
