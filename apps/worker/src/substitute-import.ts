import { createHash } from "node:crypto";
import type { SourceName } from "@black-swan/domain";
import { SubstitutePostRepository } from "@black-swan/db";

const substitutePostRepository = new SubstitutePostRepository();

export interface ClassifiedSubstituteListing {
  source: SourceName;
  sourcePostId: string;
  url: string;
  collectedAt: string;
  state?: string;
  raw: Record<string, unknown> | null;
  classification: Record<string, unknown> | null;
  lifecycle?: { expiresAt?: string | null };
}

export interface ImportSubstituteResult {
  imported: number;
  skipped: number;
  deleted: number;
}

export async function importSubstituteClassifiedFile(filePath: string): Promise<ImportSubstituteResult> {
  const fs = await import("node:fs/promises");
  const payload = JSON.parse(await fs.readFile(filePath, "utf8")) as {
    listings: ClassifiedSubstituteListing[];
  };

  let imported = 0;
  let skipped = 0;
  let deleted = 0;

  for (const item of payload.listings) {
    if (item.state === "deleted" || item.state === "missing") {
      try {
        await substitutePostRepository.updateStatusBySourcePost(item.source, item.sourcePostId, "DELETED");
        deleted += 1;
      } catch {
        skipped += 1;
      }
      continue;
    }

    if (!item.raw || !item.classification) {
      skipped += 1;
      continue;
    }

    const contentHash = hashSubstituteContent(item.raw);
    const existing = await substitutePostRepository.findBySourcePostIds(item.source, [item.sourcePostId]);
    if (existing[0]?.contentHash === contentHash) {
      skipped += 1;
      continue;
    }

    await upsertSubstituteListing(item, contentHash);
    imported += 1;
  }

  return { imported, skipped, deleted };
}

export async function upsertSubstituteListing(item: ClassifiedSubstituteListing, contentHash?: string) {
  if (!item.raw || !item.classification) {
    throw new Error(`Missing raw/classification for ${item.sourcePostId}`);
  }

  const classification = item.classification;
  const schedule = asRecord(classification.schedule);
  const locations = Array.isArray(classification.locations) ? classification.locations : [];
  const primaryLocation = (locations[0] as Record<string, unknown> | undefined) ?? {};
  const contact = asRecord(classification.contact);
  const pay = asRecord(classification.pay);
  const lessonDates = stringArray(schedule.lessonDates);
  const expiresAtRaw = item.lifecycle?.expiresAt ?? computeExpiresAt(lessonDates, stringValue(item.raw.postedDate));

  return substitutePostRepository.upsert({
    source: item.source,
    sourcePostId: item.sourcePostId,
    sourceUrl: item.url,
    title: stringValue(item.raw.title) || "Untitled substitute post",
    body: stringValue(item.raw.detailText),
    author: stringValue(item.raw.author),
    authorMemberNo: stringValue(item.raw.authorMemberNo),
    postedAt: parseDate(stringValue(item.raw.postedDate)),
    lessonDates,
    timeSlots: parseTimeSlots(schedule.times),
    audienceTypes: stringArray(classification.audiences),
    subjectTypes: stringArray(classification.subjects),
    locationText: stringValue(primaryLocation.raw) || stringValue(primaryLocation.locationText),
    sido: stringValue(primaryLocation.sido),
    sigungu: stringValue(primaryLocation.sigungu),
    dongOrStation: stringValue(primaryLocation.dongOrStation),
    payText: stringValue(pay.amountText) || stringValue(classification.payText),
    contactMethods: stringArray(contact.methods),
    contactEmails: stringArray(contact.emails).length
      ? stringArray(contact.emails)
      : stringArray(item.raw.contactEmails),
    contactPhones: stringArray(contact.phones).length
      ? stringArray(contact.phones)
      : stringArray(item.raw.contactPhones),
    urgency: stringValue(classification.urgency),
    status: resolveStatus(lessonDates, expiresAtRaw),
    expiresAt: parseDate(expiresAtRaw),
    recommendCount: numberValue(item.raw.recommendCount) ?? 0,
    viewCount: numberValue(item.raw.viewCount) ?? 0,
    raw: item.raw,
    classification,
    contentHash: contentHash ?? hashSubstituteContent(item.raw),
    lastSeenAt: new Date(item.collectedAt),
  });
}

export function hashSubstituteContent(raw: Record<string, unknown>): string {
  return createHash("sha256")
    .update([stringValue(raw.title), stringValue(raw.detailText)].join("\n"))
    .digest("hex");
}

function resolveStatus(lessonDates: string[], expiresAtRaw: string | null): "OPEN" | "EXPIRED" | "DELETED" {
  const today = todayKstDate();
  if (lessonDates.length > 0 && lessonDates.every((date) => date < today)) return "EXPIRED";
  if (expiresAtRaw) {
    const expiresDate = expiresAtRaw.slice(0, 10);
    if (expiresDate < today) return "EXPIRED";
  }
  return "OPEN";
}

function computeExpiresAt(lessonDates: string[], postedDate: string | null): string | null {
  if (lessonDates.length > 0) {
    return `${lessonDates[lessonDates.length - 1]}T23:59:59+09:00`;
  }
  if (postedDate) {
    const posted = new Date(postedDate);
    posted.setDate(posted.getDate() + 7);
    return posted.toISOString();
  }
  return null;
}

function todayKstDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function parseTimeSlots(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return {
        start: stringValue(record.start),
        end: stringValue(record.end),
        raw: stringValue(record.raw),
      };
    })
    .filter((item): item is { start: string | null; end: string | null; raw: string | null } => item != null);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
