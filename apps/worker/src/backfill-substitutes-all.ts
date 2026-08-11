import { pathToFileURL } from "node:url";
import { prisma } from "@balink/db";
import { SUBSTITUTE_NORMALIZATION_VERSION } from "@balink/domain";
import {
  hashSubstituteContent,
  persistNormalizedSubstitute,
  type SubstituteRawRecord,
} from "./substitute-import.js";
import { refreshSubstituteLifecycle } from "./substitute-lifecycle.js";
import { formatSubstitutePost, validateFormattedSubstitute } from "./substitute-formatter.js";

export interface BackfillSubstitutesAllOptions {
  dryRun?: boolean;
  limit?: number;
  /** true면 normalizationVersion이 이미 최신인 글은 건너뜀 */
  onlyOutdated?: boolean;
  status?: "OPEN" | "EXPIRED" | "DELETED" | "ALL";
}

export interface BackfillSubstitutesAllSummary {
  targeted: number;
  updated: number;
  skipped: number;
  failed: number;
  failures: string[];
}

export async function backfillSubstitutesAll(
  options: BackfillSubstitutesAllOptions = {},
): Promise<BackfillSubstitutesAllSummary> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for substitute backfill");
  }

  const summary: BackfillSubstitutesAllSummary = {
    targeted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    failures: [],
  };

  const where = {
    ...(options.status && options.status !== "ALL" ? { status: options.status } : { status: "OPEN" as const }),
  };

  const posts = await prisma.substitutePost.findMany({
    where,
    orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
    ...(options.limit ? { take: options.limit } : {}),
  });

  summary.targeted = posts.length;
  console.log(`[backfill-substitutes-all] targets=${posts.length} onlyOutdated=${Boolean(options.onlyOutdated)}`);

  if (options.dryRun) {
    for (const post of posts) {
      const raw = buildRawRecord(post);
      const detailText = raw.detailText?.trim();
      if (!detailText) {
        console.log(`- skip ${post.sourcePostId}\t${post.id}\t(empty body)`);
        continue;
      }
      if (options.onlyOutdated && post.normalizationVersion >= SUBSTITUTE_NORMALIZATION_VERSION) {
        console.log(`- skip ${post.sourcePostId}\t${post.id}\tv${post.normalizationVersion}`);
        continue;
      }
      console.log(`- run ${post.sourcePostId}\t${post.id}\tv${post.normalizationVersion}\t${post.title.slice(0, 50)}`);
    }
    return summary;
  }

  const collectedAt = new Date().toISOString();

  for (const post of posts) {
    const raw = buildRawRecord(post);
    const detailText = raw.detailText?.trim();
    if (!detailText) {
      summary.skipped += 1;
      console.log(`[backfill-substitutes-all] skipped ${post.sourcePostId}: empty body`);
      continue;
    }

    if (options.onlyOutdated && post.normalizationVersion >= SUBSTITUTE_NORMALIZATION_VERSION) {
      summary.skipped += 1;
      continue;
    }

    try {
      const formatted = await formatSubstitutePost({
        title: raw.title,
        detailText,
        postedAt: raw.postedAtIso || raw.postedDate,
      });
      validateFormattedSubstitute(formatted, [raw.title, detailText].join("\n"));

      const contentHash = hashSubstituteContent(raw.title, detailText);
      await persistNormalizedSubstitute({
        source: post.source,
        sourcePostId: post.sourcePostId,
        sourceUrl: post.sourceUrl,
        collectedAt,
        raw: { ...raw, detailText },
        formatted,
        contentHash,
      });

      summary.updated += 1;
      console.log(
        `[backfill-substitutes-all] updated ${post.sourcePostId}: pay=${formatted.representativePay.displayText}`,
      );
      await sleep(200);
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      summary.failures.push(`${post.sourcePostId}: ${message}`);
      console.error(`[backfill-substitutes-all] failed ${post.sourcePostId}: ${message}`);
    }
  }

  const lifecycle = await refreshSubstituteLifecycle();
  console.log(
    `[backfill-substitutes-all] lifecycle expired=${lifecycle.expired} deleted=${lifecycle.deleted}`,
  );

  return summary;
}

function buildRawRecord(post: {
  title: string;
  body: string | null;
  author: string | null;
  authorMemberNo: string | null;
  recommendCount: number;
  viewCount: number;
  postedAt: Date | null;
  rawJson: unknown;
}): SubstituteRawRecord {
  const raw = asRecord(post.rawJson);
  const postedAtIso =
    stringValue(raw.postedAtIso) ||
    (post.postedAt ? post.postedAt.toISOString() : null);

  return {
    title: stringValue(raw.title) || post.title,
    detailText: stringValue(raw.detailText) || post.body,
    author: stringValue(raw.author) || post.author,
    authorMemberNo: stringValue(raw.authorMemberNo) || post.authorMemberNo,
    postedDate:
      stringValue(raw.postedDate) ||
      (postedAtIso ? postedAtIso.slice(0, 10) : null),
    postedAtIso,
    contactPhones: stringArray(raw.contactPhones),
    contactEmails: stringArray(raw.contactEmails),
    recommendCount: numberValue(raw.recommendCount) ?? post.recommendCount,
    viewCount: numberValue(raw.viewCount) ?? post.viewCount,
  };
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

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const summary = await backfillSubstitutesAll({
    dryRun: Boolean(args.dryRun),
    limit: args.limit ? Number(args.limit) : undefined,
    onlyOutdated: Boolean(args.onlyOutdated),
    status: args.status,
  });

  console.log(`[backfill-substitutes-all] complete: ${JSON.stringify(summary)}`);
  await prisma.$disconnect();
}

function parseArgs(argv: string[]) {
  const parsed: {
    dryRun?: boolean;
    limit?: string;
    onlyOutdated?: boolean;
    status?: "OPEN" | "EXPIRED" | "DELETED" | "ALL";
  } = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--limit") parsed.limit = argv[++index];
    else if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--only-outdated") parsed.onlyOutdated = true;
    else if (arg === "--status") parsed.status = argv[++index] as "OPEN" | "EXPIRED" | "DELETED" | "ALL";
  }

  return parsed;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
}
