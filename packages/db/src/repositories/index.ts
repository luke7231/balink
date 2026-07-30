import type { JobPostFilterInput, SourceName } from "@black-swan/domain";
import type { Prisma } from "@prisma/client";
import { prisma } from "../client.js";
import { toJobPostDetail, toJobPostSourceLink, toJobPostSummary, toScraperRunSummary } from "../mappers/index.js";

const sourcePostSelect = {
  id: true,
  sourcePostId: true,
  sourceUrl: true,
  title: true,
  postedAt: true,
} as const;

export class JobPostRepository {
  buildWhere(filter: JobPostFilterInput | null | undefined): Prisma.JobPostWhereInput {
    return {
      isBallet: true,
      ...(filter?.sido ? { sido: filter.sido } : {}),
      ...(filter?.sigungu ? { sigungu: filter.sigungu } : {}),
      ...(filter?.jobType ? { jobType: filter.jobType } : {}),
      ...(filter?.source ? { sourcePrimary: filter.source } : {}),
    };
  }

  async findMany(where: Prisma.JobPostWhereInput, skip: number, take: number) {
    const items = await prisma.jobPost.findMany({
      where,
      orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take,
    });
    return items.map(toJobPostSummary);
  }

  async count(where: Prisma.JobPostWhereInput) {
    return prisma.jobPost.count({ where });
  }

  async findById(id: string) {
    const job = await prisma.jobPost.findUnique({
      where: { id },
      include: {
        jobPostSources: {
          include: { sourcePost: { select: sourcePostSelect } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return job ? toJobPostDetail(job) : null;
  }

  async findSources(jobPostId: string) {
    const links = await prisma.jobPostSource.findMany({
      where: { jobPostId },
      include: { sourcePost: { select: sourcePostSelect } },
      orderBy: { createdAt: "asc" },
    });
    return links.map(toJobPostSourceLink);
  }

  async groupRegions() {
    return prisma.jobPost.groupBy({
      by: ["sido", "sigungu"],
      where: { isBallet: true, sido: { not: null }, sigungu: { not: null } },
      _count: { _all: true },
      orderBy: [{ sido: "asc" }, { sigungu: "asc" }],
    });
  }

  async countBalletPosts() {
    return prisma.jobPost.count({ where: { isBallet: true } });
  }
}

export interface ImportClassifiedItemInput {
  source: SourceName;
  sourcePostId: string;
  url: string;
  collectedAt: string;
  raw: Record<string, unknown>;
  classification: Record<string, unknown>;
  normalized: {
    title: string;
    postedAt: Date | null;
    contentHash: string;
    sourceConfidence: string | null;
    jobPostData: Prisma.JobPostCreateInput;
  };
}

export class SourcePostRepository {
  async findExistingSourcePostIds(source: SourceName, sourcePostIds: string[]): Promise<Set<string>> {
    if (sourcePostIds.length === 0) return new Set();

    const rows = await prisma.sourcePost.findMany({
      where: {
        source,
        sourcePostId: { in: sourcePostIds },
      },
      select: { sourcePostId: true },
    });

    return new Set(rows.map((row) => row.sourcePostId));
  }

  async importClassifiedItem(input: ImportClassifiedItemInput) {
    return prisma.$transaction(async (tx) => {
      const sourcePost = await tx.sourcePost.upsert({
        where: {
          source_sourcePostId: {
            source: input.source,
            sourcePostId: input.sourcePostId,
          },
        },
        update: {
          sourceUrl: input.url,
          title: input.normalized.title,
          postedAt: input.normalized.postedAt,
          rawJson: input.raw as Prisma.InputJsonValue,
          classificationJson: input.classification as Prisma.InputJsonValue,
          contentHash: input.normalized.contentHash,
          fetchedAt: new Date(input.collectedAt),
        },
        create: {
          source: input.source,
          sourcePostId: input.sourcePostId,
          sourceUrl: input.url,
          title: input.normalized.title,
          postedAt: input.normalized.postedAt,
          rawJson: input.raw as Prisma.InputJsonValue,
          classificationJson: input.classification as Prisma.InputJsonValue,
          contentHash: input.normalized.contentHash,
          fetchedAt: new Date(input.collectedAt),
        },
      });

      const existingLink = await tx.jobPostSource.findFirst({
        where: { sourcePostId: sourcePost.id },
        select: { jobPostId: true },
      });

      const jobPost = existingLink
        ? await tx.jobPost.update({
            where: { id: existingLink.jobPostId },
            data: input.normalized.jobPostData,
          })
        : await tx.jobPost.create({
            data: input.normalized.jobPostData,
          });

      await tx.jobPostSource.upsert({
        where: {
          jobPostId_sourcePostId: {
            jobPostId: jobPost.id,
            sourcePostId: sourcePost.id,
          },
        },
        update: {
          sourceUrl: input.url,
          confidence: input.normalized.sourceConfidence,
        },
        create: {
          jobPostId: jobPost.id,
          sourcePostId: sourcePost.id,
          source: input.source,
          sourceUrl: input.url,
          confidence: input.normalized.sourceConfidence,
        },
      });

      return { sourcePostId: sourcePost.id, jobPostId: jobPost.id };
    });
  }
}

export class ScraperRunRepository {
  async createRunning(input: { source?: SourceName; targetDate: string; llmMode: string }) {
    return prisma.scraperRun.create({
      data: {
        source: input.source ?? null,
        targetDate: input.targetDate,
        llmMode: input.llmMode,
        status: "running",
      },
    });
  }

  async markSuccess(
    id: string,
    data: { collected: number; classified: number; imported: number; logs: Prisma.InputJsonValue },
  ) {
    return prisma.scraperRun.update({
      where: { id },
      data: {
        status: "success",
        finishedAt: new Date(),
        collected: data.collected,
        classified: data.classified,
        imported: data.imported,
        logs: data.logs,
      },
    });
  }

  async markFailed(
    id: string,
    data: {
      collected: number;
      classified: number;
      imported: number;
      errorMessage: string;
      logs: Prisma.InputJsonValue;
    },
  ) {
    return prisma.scraperRun.update({
      where: { id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        collected: data.collected,
        classified: data.classified,
        imported: data.imported,
        errorMessage: data.errorMessage,
        logs: data.logs,
      },
    });
  }

  async listRecent(limit: number) {
    const runs = await prisma.scraperRun.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
    });
    return runs.map((run) => toScraperRunSummary(run));
  }

  async findLatest() {
    const run = await prisma.scraperRun.findFirst({
      orderBy: { startedAt: "desc" },
    });
    return run ? toScraperRunSummary(run) : null;
  }
}

export class DatabaseHealthRepository {
  async ping() {
    await prisma.$queryRaw`SELECT 1`;
  }
}
