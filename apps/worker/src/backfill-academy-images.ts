import { pathToFileURL } from "node:url";
import { prisma, type Prisma } from "@black-swan/db";
import type { SourceName } from "@black-swan/domain";
import { mirrorAcademyImagesToS3, parseRawAcademyImages } from "./academy-images.js";
import {
  fetchBalletmaniaAcademyImages,
  loginBalletmania,
  parseBalletmaniaAcademyImages,
} from "./balletmania-academy-images.js";

interface BackfillOptions {
  date?: string;
  id?: string;
  dryRun: boolean;
  limit?: number;
}

interface BackfillSummary {
  targeted: number;
  updated: number;
  skipped: number;
}

export async function backfillAcademyImages(options: BackfillOptions): Promise<BackfillSummary> {
  const summary: BackfillSummary = { targeted: 0, updated: 0, skipped: 0 };
  const posts = await prisma.jobPost.findMany({
    where: buildWhere(options),
    include: {
      jobPostSources: {
        include: { sourcePost: true },
      },
    },
    orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
    ...(options.limit ? { take: options.limit } : {}),
  });

  summary.targeted = posts.length;
  console.log(`[backfill-academy-images] targets=${posts.length}`);

  let balletmaniaCookie: string | null = null;

  for (const post of posts) {
    const link = post.jobPostSources[0];
    const sourcePost = link?.sourcePost;
    if (!sourcePost) {
      summary.skipped += 1;
      continue;
    }

    const raw = asRecord(sourcePost.rawJson);
    let rawImages = parseRawAcademyImages(raw.academyImages);

    if (!rawImages && post.sourcePrimary === "balletmania") {
      if (!balletmaniaCookie) {
        balletmaniaCookie = await loginBalletmania();
      }
      rawImages = await fetchBalletmaniaAcademyImages(link.sourceUrl, balletmaniaCookie);
      if (rawImages) {
        raw.academyImages = rawImages;
      }
    }

    if (!rawImages) {
      summary.skipped += 1;
      console.log(`[skip] ${post.id}\tno academy images`);
      continue;
    }

    if (options.dryRun) {
      console.log(`[dry-run] ${post.id}\tlogo=${rawImages.logoUrl ? "yes" : "no"}\tgallery=${rawImages.gallery.length}`);
      continue;
    }

    const stored = await mirrorAcademyImagesToS3(
      post.sourcePrimary as SourceName,
      sourcePost.sourcePostId,
      rawImages,
    );

    if (!stored) {
      summary.skipped += 1;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.jobPost.update({
        where: { id: post.id },
        data: {
          academyLogoUrl: stored.logoUrl,
          academyGalleryJson: stored.gallery as unknown as Prisma.InputJsonValue,
        },
      });

      await tx.sourcePost.update({
        where: { id: sourcePost.id },
        data: {
          rawJson: {
            ...raw,
            academyImages: rawImages,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    });

    summary.updated += 1;
    console.log(
      `[updated] ${post.id}\tlogo=${stored.logoUrl ? "yes" : "no"}\tgallery=${stored.gallery.length}`,
    );
  }

  return summary;
}

function buildWhere(options: BackfillOptions) {
  if (options.id) {
    return { id: options.id };
  }

  if (options.date) {
    const range = kstDateRange(options.date);
    return {
      postedAt: {
        gte: range.start,
        lt: range.endExclusive,
      },
    };
  }

  return {};
}

function kstDateRange(date: string) {
  const start = new Date(`${date}T00:00:00.000+09:00`);
  const endExclusive = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, endExclusive };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const summary = await backfillAcademyImages(args);
  console.log(`[backfill-academy-images] complete: ${JSON.stringify(summary)}`);
}

function parseArgs(argv: string[]): BackfillOptions {
  const options: BackfillOptions = { dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--date") options.date = argv[++index];
    else if (arg === "--id") options.id = argv[++index];
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--limit") options.limit = Number(argv[++index]);
  }
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
