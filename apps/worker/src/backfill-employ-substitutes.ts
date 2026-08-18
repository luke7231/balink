import { pathToFileURL } from "node:url";
import { prisma, SubstitutePostRepository } from "@balink/db";
import {
  toEmploySubstituteSourcePostId,
  type SourceName,
} from "@balink/domain";
import {
  hashSubstituteContent,
  persistNormalizedSubstitute,
  type SubstituteRawRecord,
} from "./substitute-import.js";
import { formatSubstitutePost, validateFormattedSubstitute } from "./substitute-formatter.js";

const substitutePostRepository = new SubstitutePostRepository();

export interface BackfillEmploySubstitutesOptions {
  dryRun?: boolean;
  limit?: number;
  offset?: number;
  ids?: string[];
}

export interface BackfillEmploySubstitutesSummary {
  targeted: number;
  moved: number;
  skipped: number;
  failed: number;
  failures: string[];
}

export async function backfillEmploySubstitutes(
  options: BackfillEmploySubstitutesOptions = {},
): Promise<BackfillEmploySubstitutesSummary> {
  if (!options.dryRun && !process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for employ-substitute backfill");
  }

  const summary: BackfillEmploySubstitutesSummary = {
    targeted: 0,
    moved: 0,
    skipped: 0,
    failed: 0,
    failures: [],
  };

  const jobs = await prisma.jobPost.findMany({
    where: {
      jobType: "substitute",
      ...(options.ids?.length ? { id: { in: options.ids } } : {}),
    },
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
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  summary.targeted = jobs.length;
  console.log(
    `[backfill-employ-substitutes] targets=${jobs.length} dryRun=${Boolean(options.dryRun)}`,
  );

  for (const [index, job] of jobs.entries()) {
    const label = `${index + 1}/${jobs.length} ${job.id}`;
    const link = job.jobPostSources[0];
    if (!link) {
      summary.skipped += 1;
      console.log(`[backfill-employ-substitutes] skipped ${label}: no source link`);
      continue;
    }

    const source = link.source as SourceName;
    const originalSourcePostId = link.sourcePost.sourcePostId;
    const sourceUrl = link.sourceUrl || link.sourcePost.sourceUrl;
    const title = job.title;
    const detailText = job.description;
    const contactPhones = asStringArray(job.contactPhones);
    const contactEmails = asStringArray(job.contactEmails);

    try {
      const existingByUrl = await substitutePostRepository.findBySourceUrl(sourceUrl);
      const substituteSource = existingByUrl?.source ?? source;
      const substituteSourcePostId =
        existingByUrl?.sourcePostId ?? toEmploySubstituteSourcePostId(originalSourcePostId);

      if (options.dryRun) {
        summary.moved += 1;
        console.log(
          `[backfill-employ-substitutes] dry-run ${label}: ${source}:${originalSourcePostId} → ${substituteSource}:${substituteSourcePostId}`,
        );
        continue;
      }

      const rawRecord: SubstituteRawRecord = {
        title,
        detailText,
        author: stringValue(asRecord(link.sourcePost.rawJson).company),
        authorMemberNo: null,
        postedDate: job.postedAt ? job.postedAt.toISOString().slice(0, 10) : null,
        postedAtIso: job.postedAt?.toISOString() ?? null,
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
        sourceUrl,
        collectedAt: new Date().toISOString(),
        raw: rawRecord,
        formatted,
        contentHash: hashSubstituteContent(title, detailText),
        fanOutInbox: false,
      });

      await prisma.jobPost.delete({ where: { id: job.id } });
      summary.moved += 1;
      console.log(
        `[backfill-employ-substitutes] moved ${label}: ${substituteSource}:${substituteSourcePostId}`,
      );
      await sleep(150);
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      summary.failures.push(`${job.id}: ${message}`);
      console.error(`[backfill-employ-substitutes] failed ${label}: ${message}`);
    }
  }

  return summary;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const summary = await backfillEmploySubstitutes({
    dryRun: Boolean(args.dryRun),
    limit: args.limit ? Number(args.limit) : undefined,
    offset: args.offset ? Number(args.offset) : undefined,
    ids: args.ids,
  });
  console.log(`[backfill-employ-substitutes] complete: ${JSON.stringify(summary)}`);
  if (summary.failures.length) {
    console.log(`[backfill-employ-substitutes] failures:\n${summary.failures.join("\n")}`);
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
