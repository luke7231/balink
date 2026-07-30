import { pathToFileURL } from "node:url";
import { sanitizeLocationTextForStorage } from "@black-swan/domain";
import { prisma, type Prisma } from "@black-swan/db";
import { enrichListing } from "./llm-formatter.js";

interface BackfillOptions {
  date: string;
  dryRun: boolean;
  limit?: number;
}

interface BackfillSummary {
  targeted: number;
  updated: number;
  skipped: number;
}

export async function backfillFormattedFields(options: BackfillOptions): Promise<BackfillSummary> {
  const summary: BackfillSummary = { targeted: 0, updated: 0, skipped: 0 };
  const range = kstDateRange(options.date);
  const posts = await prisma.jobPost.findMany({
    where: {
      postedAt: {
        gte: range.start,
        lt: range.endExclusive,
      },
    },
    include: {
      jobPostSources: {
        include: {
          sourcePost: true,
        },
      },
    },
    orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
    ...(options.limit ? { take: options.limit } : {}),
  });

  summary.targeted = posts.length;
  console.log(`[backfill-formatted] date=${options.date} targets=${posts.length}`);

  if (options.dryRun) {
    for (const post of posts) {
      console.log(`- ${post.id}\t${post.sourcePrimary}\t${post.title}`);
    }
    return summary;
  }

  for (const post of posts) {
    const sourcePost = post.jobPostSources[0]?.sourcePost;
    if (!sourcePost) {
      summary.skipped += 1;
      continue;
    }

    const raw = asRecord(sourcePost.rawJson);
    const classification = asRecord(sourcePost.classificationJson);
    const enrichment = await enrichListing({ raw });
    const location = enrichment.location;
    const representativePay = enrichment.representativePay;
    const confidenceJson = {
      ...asRecord(post.confidenceJson),
      formatting: enrichment.meta,
      locationSource: location.source,
      locationConfidence: location.confidence,
      representativePayConfidence: representativePay.confidence,
    };

    await prisma.$transaction(async (tx) => {
      await tx.jobPost.update({
        where: { id: post.id },
        data: {
          locationText: sanitizeLocationTextForStorage(
            post.locationText,
            location.sido,
            location.sigungu,
            location.dongOrStation,
          ),
          sido: location.sido,
          sigungu: location.sigungu,
          dongOrStation: location.dongOrStation,
          locationSource: location.source,
          displaySectionsJson: enrichment.displaySections as unknown as Prisma.InputJsonValue,
          representativePayUnit: representativePay.unit,
          representativePayText: representativePay.displayText,
          representativePayMinManwon: representativePay.minManwon,
          representativePayMaxManwon: representativePay.maxManwon,
          representativePayJson: representativePay as unknown as Prisma.InputJsonValue,
          confidenceJson: confidenceJson as Prisma.InputJsonValue,
          normalizedJson: {
            ...asRecord(post.normalizedJson),
            enrichment,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      await tx.sourcePost.update({
        where: { id: sourcePost.id },
        data: {
          classificationJson: {
            ...classification,
            enrichment,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    });

    summary.updated += 1;
    console.log(
      `[updated] ${post.id}\t${representativePay.displayText}\t${location.sido ?? "-"} ${location.sigungu ?? "-"}`,
    );
    await sleep(250);
  }

  return summary;
}

function kstDateRange(date: string) {
  const start = new Date(`${date}T00:00:00.000+09:00`);
  const endExclusive = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, endExclusive };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const date = args.date || getTodayKstDate();
  const summary = await backfillFormattedFields({
    date,
    dryRun: Boolean(args.dryRun),
    limit: args.limit ? Number(args.limit) : undefined,
  });

  console.log(`[backfill-formatted] complete: ${JSON.stringify(summary)}`);
  await prisma.$disconnect();
}

function parseArgs(argv: string[]) {
  const parsed: { date?: string; dryRun?: boolean; limit?: string } = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--date") parsed.date = argv[++index];
    else if (arg === "--limit") parsed.limit = argv[++index];
    else if (arg === "--dry-run") parsed.dryRun = true;
  }
  return parsed;
}

function getTodayKstDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const isDirectRun = Boolean(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href);

if (isDirectRun) {
  main().catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
}
