import { pathToFileURL } from "node:url";
import { prisma, SourcePostRepository } from "@balink/db";
import {
  isBlockedJobContent,
  type SourceName,
} from "@balink/domain";

const sourcePostRepository = new SourcePostRepository();

export interface BackfillBlockedJobsOptions {
  dryRun?: boolean;
  limit?: number;
  offset?: number;
  ids?: string[];
}

export interface BackfillBlockedJobsSummary {
  scanned: number;
  matched: number;
  removed: number;
  skipped: number;
  failed: number;
  failures: string[];
  matches: Array<{ id: string; title: string; matched: string | null }>;
}

export async function backfillBlockedJobs(
  options: BackfillBlockedJobsOptions = {},
): Promise<BackfillBlockedJobsSummary> {
  const summary: BackfillBlockedJobsSummary = {
    scanned: 0,
    matched: 0,
    removed: 0,
    skipped: 0,
    failed: 0,
    failures: [],
    matches: [],
  };

  const explicitIds = options.ids?.length
    ? options.ids
    : undefined;

  const jobs = await prisma.jobPost.findMany({
    where: explicitIds?.length ? { id: { in: explicitIds } } : undefined,
    orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
    skip: options.offset ?? 0,
    ...(options.limit ? { take: options.limit } : {}),
    include: {
      jobPostSources: {
        include: {
          sourcePost: {
            select: {
              id: true,
              source: true,
              sourcePostId: true,
              sourceUrl: true,
              rawJson: true,
              classificationJson: true,
              contentHash: true,
              postedAt: true,
              fetchedAt: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  summary.scanned = jobs.length;
  console.log(
    `[backfill-blocked-jobs] scanned=${jobs.length} dryRun=${Boolean(options.dryRun)}`,
  );

  for (const [index, job] of jobs.entries()) {
    const label = `${index + 1}/${jobs.length} ${job.id}`;
    const link = job.jobPostSources[0];
    const raw = asRecord(link?.sourcePost.rawJson);
    const title = job.title || stringValue(raw.title) || "";
    const company = stringValue(raw.company);
    const detailText = stringValue(raw.detailText) || job.description;
    const blocked = isBlockedJobContent({
      title,
      company,
      detailText,
      description: job.description,
    });

    if (!blocked.blocked) {
      summary.skipped += 1;
      continue;
    }

    summary.matched += 1;
    summary.matches.push({
      id: job.id,
      title: job.title,
      matched: blocked.matched ?? null,
    });

    if (!link) {
      summary.failed += 1;
      summary.failures.push(`${job.id}: matched but no source link`);
      console.error(`[backfill-blocked-jobs] failed ${label}: no source link`);
      continue;
    }

    try {
      if (options.dryRun) {
        summary.removed += 1;
        console.log(
          `[backfill-blocked-jobs] dry-run ${label}: matched=${blocked.matched} title=${job.title}`,
        );
        continue;
      }

      const existingClassification = asRecord(link.sourcePost.classificationJson);
      const classification = {
        ...existingClassification,
        dropReason: blocked.reason ?? "blocked",
        blocked: true,
        blockedMatched: blocked.matched ?? null,
      };

      await sourcePostRepository.upsertSourcePostWithoutJob({
        source: link.source as SourceName,
        sourcePostId: link.sourcePost.sourcePostId,
        url: link.sourceUrl || link.sourcePost.sourceUrl,
        title: job.title,
        postedAt: link.sourcePost.postedAt ?? job.postedAt,
        collectedAt: (link.sourcePost.fetchedAt ?? new Date()).toISOString(),
        raw,
        classification,
        contentHash:
          link.sourcePost.contentHash ||
          `blocked:${link.source}:${link.sourcePost.sourcePostId}`,
        sourceConfidence: stringValue(existingClassification.balletConfidence),
      });

      summary.removed += 1;
      console.log(
        `[backfill-blocked-jobs] removed ${label}: matched=${blocked.matched}`,
      );
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      summary.failures.push(`${job.id}: ${message}`);
      console.error(`[backfill-blocked-jobs] failed ${label}: ${message}`);
    }
  }

  return summary;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const summary = await backfillBlockedJobs({
    dryRun: Boolean(args.dryRun),
    limit: args.limit ? Number(args.limit) : undefined,
    offset: args.offset ? Number(args.offset) : undefined,
    ids: args.ids,
  });
  console.log(`[backfill-blocked-jobs] complete: ${JSON.stringify(summary)}`);
  if (summary.failures.length) {
    console.log(`[backfill-blocked-jobs] failures:\n${summary.failures.join("\n")}`);
  }
  await prisma.$disconnect();
  if (summary.failed > 0) process.exitCode = 1;
}

function parseArgs(argv: string[]) {
  const parsed: { dryRun?: boolean; limit?: string; offset?: string; ids?: string[] } = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--limit") parsed.limit = argv[++index];
    else if (arg === "--offset") parsed.offset = argv[++index];
    else if (arg === "--ids") {
      parsed.ids = (argv[++index] || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    }
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
