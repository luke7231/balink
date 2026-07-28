import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import type { Prisma, PrismaSourceName } from "@black-swan/db";
import { SourcePostRepository } from "@black-swan/db";
import type { SourceName } from "@black-swan/domain";
import { classifiedPayloadSchema, parseOrThrow } from "@black-swan/validation";

const sourcePostRepository = new SourcePostRepository();

interface ImportResult {
  imported: number;
}

export async function importClassifiedFile(filePath: string): Promise<ImportResult> {
  const rawPayload = JSON.parse(await fs.readFile(filePath, "utf8"));
  const payload = parseOrThrow(classifiedPayloadSchema, rawPayload, "Invalid classified payload");
  let imported = 0;

  for (const item of payload.listings) {
    await importClassifiedItem(payload.source, item);
    imported += 1;
  }

  return { imported };
}

async function importClassifiedItem(
  source: SourceName,
  item: {
    sourcePostId: string;
    url: string;
    collectedAt: string;
    raw: Record<string, unknown>;
    classification: Record<string, unknown>;
  },
): Promise<void> {
  const normalized = normalizeItem(source, item);
  await sourcePostRepository.importClassifiedItem({
    source,
    sourcePostId: item.sourcePostId,
    url: item.url,
    collectedAt: item.collectedAt,
    raw: item.raw,
    classification: item.classification,
    normalized,
  });
}

function normalizeItem(
  source: SourceName,
  item: {
    sourcePostId: string;
    url: string;
    raw: Record<string, unknown>;
    classification: Record<string, unknown>;
  },
) {
  const raw = item.raw;
  const classification = item.classification;
  const location = firstObject(classification.locations);
  const schedule = asRecord(classification.schedule);
  const pay = asRecord(classification.pay);
  const contact = asRecord(classification.contact);
  const requirements = asRecord(classification.requirements);
  const llm = asRecord(classification.llm);
  const title = stringValue(raw.title) || "Untitled job post";
  const description = stringValue(raw.detailText);
  const contentHash = hashContent([source, title, description, stringValue(raw.postedDate)].join("\n"));

  const normalizedJson = {
    source,
    sourcePostId: item.sourcePostId,
    sourceUrl: item.url,
    title,
    description,
    raw,
    classification,
  };

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
      locationText: stringValue(location.raw) || stringValue(raw.summaryRegionText),
      sido: stringValue(location.sido),
      sigungu: stringValue(location.sigungu),
      dongOrStation: stringValue(location.dongOrStation),
      days: jsonArray(schedule.days),
      timeSlots: jsonArray(schedule.timeSlots),
      times: jsonArray(schedule.times),
      classCount: numberValue(schedule.classCount),
      durationMinutes: numberValue(schedule.durationMinutes),
      payType: stringValue(pay.type),
      payMinManwon: numberValue(pay.minManwon),
      payMaxManwon: numberValue(pay.maxManwon),
      payText: stringValue(pay.amountText),
      payNegotiable: Boolean(pay.isNegotiable),
      contactMethods: jsonArray(contact.applyMethods),
      contactEmails: jsonArray(contact.emails),
      contactPhones: jsonArray(contact.phones),
      requirementsJson: requirements as Prisma.InputJsonValue,
      confidenceJson: llm as Prisma.InputJsonValue,
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
  if (!Array.isArray(value)) return {};
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
