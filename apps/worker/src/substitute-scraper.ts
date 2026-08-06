import type { Prisma } from "@black-swan/db";
import { ScraperRunRepository, SubstitutePostRepository } from "@black-swan/db";
import { SUBSTITUTE_NORMALIZATION_VERSION } from "@black-swan/domain";
import type { LlmMode } from "@black-swan/domain";
import { config } from "./config.js";
import {
  buildWorkingListUrl,
  fetchEucKrHtml,
  getTodayKstDate,
  loginBalletmania,
  parseWorkingDetail,
  parseWorkingListings,
} from "./balletmania-working.js";
import {
  hashSubstituteContent,
  persistNormalizedSubstitute,
  type SubstituteRawRecord,
} from "./substitute-import.js";
import { refreshSubstituteLifecycle } from "./substitute-lifecycle.js";
import { formatSubstitutePost, validateFormattedSubstitute } from "./substitute-formatter.js";

const scraperRunRepository = new ScraperRunRepository();
const substitutePostRepository = new SubstitutePostRepository();

export interface RunSubstituteScraperOptions {
  llmMode?: LlmMode;
  limit?: number;
}

export interface RunSubstituteScraperResult {
  runId: string;
  status: "success" | "failed";
  collected: number;
  unchanged: number;
  llmAttempted: number;
  normalized: number;
  llmFailed: number;
  expired: number;
  deleted: number;
  logs: string[];
}

export async function runSubstituteScraper(
  options: RunSubstituteScraperOptions = {},
): Promise<RunSubstituteScraperResult> {
  const llmMode = options.llmMode || config.substituteLlmMode;
  const limit = options.limit ?? 15;
  const date = getTodayKstDate();
  const collectedAt = new Date().toISOString();
  const run = await scraperRunRepository.createRunning({
    targetDate: date,
    llmMode,
    source: "balletmania",
  });

  const logs: string[] = [];
  let collected = 0;
  let unchanged = 0;
  let llmAttempted = 0;
  let normalized = 0;
  let llmFailed = 0;

  try {
    if (llmMode !== "all") {
      throw new Error(`Substitute pipeline requires SUBSTITUTE_LLM_MODE=all (received ${llmMode})`);
    }
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required for substitute pipeline");
    }

    const cookie = await loginBalletmania();
    const listHtml = await fetchEucKrHtml(buildWorkingListUrl(1), cookie);
    const listings = parseWorkingListings(listHtml, { todayKstDate: date }).slice(0, limit);
    collected = listings.length;

    const existingRows = await substitutePostRepository.findBySourcePostIds(
      "balletmania",
      listings.map((listing) => listing.no),
    );
    const existingByPostId = new Map(existingRows.map((row) => [row.sourcePostId, row]));

    for (const listing of listings) {
      const detailHtml = await fetchEucKrHtml(listing.url, cookie);
      const detail = parseWorkingDetail(detailHtml);
      const existing = existingByPostId.get(listing.no);

      if (detail.state === "deleted" || detail.state === "missing") {
        if (existing) {
          await substitutePostRepository.updateStatus(existing.id, "DELETED");
        }
        continue;
      }

      if (detail.state === "login_required" || !detail.detailText) {
        logs.push(`Skipped ${listing.no}: ${detail.state || "empty detail"}`);
        continue;
      }

      const raw: SubstituteRawRecord = {
        title: detail.title || listing.title,
        detailText: detail.detailText,
        author: pickAuthor(listing.author, detail.author, detail.title || listing.title),
        authorMemberNo: listing.authorMemberNo,
        postedDate: listing.postedAtIso?.slice(0, 10) || detail.postedAtIso?.slice(0, 10) || null,
        postedAtIso: listing.postedAtIso || detail.postedAtIso,
        contactPhones: detail.contactPhones,
        contactEmails: detail.contactEmails,
        recommendCount: listing.recommendCount,
        viewCount: detail.viewCount || listing.viewCount,
      };

      const contentHash = hashSubstituteContent(raw.title, raw.detailText);
      const needsNormalization =
        !existing ||
        existing.contentHash !== contentHash ||
        existing.normalizationVersion < SUBSTITUTE_NORMALIZATION_VERSION;

      if (!needsNormalization) {
        await substitutePostRepository.touchLastSeenAt("balletmania", listing.no, new Date(collectedAt));
        unchanged += 1;
        continue;
      }

      llmAttempted += 1;
      try {
        const formatted = await formatSubstitutePost({
          title: raw.title,
          detailText: raw.detailText as string,
          postedAt: raw.postedAtIso || raw.postedDate,
        });
        validateFormattedSubstitute(formatted, [raw.title, raw.detailText].join("\n"));

        await persistNormalizedSubstitute({
          source: "balletmania",
          sourcePostId: listing.no,
          sourceUrl: listing.url,
          collectedAt,
          raw,
          formatted,
          contentHash,
          fanOutInbox: true,
        });
        normalized += 1;
      } catch (error) {
        llmFailed += 1;
        const message = error instanceof Error ? error.message : String(error);
        logs.push(`LLM failed for ${listing.no}: ${message}`);
        if (!existing) {
          continue;
        }
      }
    }

    const lifecycle = await refreshSubstituteLifecycle();
    logs.push(`Lifecycle expired=${lifecycle.expired}, deleted=${lifecycle.deleted}`);

    await scraperRunRepository.markSuccess(run.id, {
      collected,
      classified: llmAttempted,
      imported: normalized,
      logs: {
        unchanged,
        llmAttempted,
        normalized,
        llmFailed,
        expired: lifecycle.expired,
        deleted: lifecycle.deleted,
        messages: logs,
      } as unknown as Prisma.InputJsonValue,
    });

    return {
      runId: run.id,
      status: "success",
      collected,
      unchanged,
      llmAttempted,
      normalized,
      llmFailed,
      expired: lifecycle.expired,
      deleted: lifecycle.deleted,
      logs,
    };
  } catch (error) {
    await scraperRunRepository.markFailed(run.id, {
      collected,
      classified: llmAttempted,
      imported: normalized,
      errorMessage: error instanceof Error ? error.message : String(error),
      logs: {
        unchanged,
        llmAttempted,
        normalized,
        llmFailed,
        messages: logs,
      } as unknown as Prisma.InputJsonValue,
    });
    throw error;
  }
}

function pickAuthor(
  listingAuthor: string | null | undefined,
  detailAuthor: string | null | undefined,
  title: string,
): string | null {
  const candidates = [detailAuthor, listingAuthor].filter(
    (value): value is string => Boolean(value && value.trim() && value !== title && !value.startsWith(title.slice(0, 12))),
  );
  return candidates[0] ?? null;
}
