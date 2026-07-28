import { prisma } from "@black-swan/db";
import { buildPageInfo, normalizePagination } from "../lib/pagination.js";
import type { JobPostFilterInput } from "../types/inputs/job-post-filter.input.js";
import {
  groupJobRegions,
  toJobPostDetail,
  toJobPostSourceLink,
  toJobPostSummary,
  type JobPostDetail,
  type JobPostSourceLink,
  type JobPostSummary,
  type JobRegionGroup,
} from "../types/domain/job-post.js";
import type { PaginatedResult, PaginationInput } from "../types/pagination.js";

export class JobPostService {
  constructor(
    private readonly options: {
      defaultPageSize: number;
      maxPageSize: number;
    },
  ) {}

  async findMany(
    filter: JobPostFilterInput | null | undefined,
    pagination: PaginationInput | null | undefined,
  ): Promise<PaginatedResult<JobPostSummary>> {
    const { page, limit, skip } = normalizePagination(pagination, {
      defaultLimit: this.options.defaultPageSize,
      maxLimit: this.options.maxPageSize,
    });

    const where = this.buildWhere(filter);

    const [items, total] = await Promise.all([
      prisma.jobPost.findMany({
        where,
        orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.jobPost.count({ where }),
    ]);

    return {
      items: items.map(toJobPostSummary),
      pageInfo: buildPageInfo(page, limit, total),
    };
  }

  async findById(id: string): Promise<JobPostDetail | null> {
    const job = await prisma.jobPost.findUnique({
      where: { id },
      include: {
        jobPostSources: {
          include: {
            sourcePost: {
              select: {
                id: true,
                sourcePostId: true,
                sourceUrl: true,
                title: true,
                postedAt: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return job ? toJobPostDetail(job) : null;
  }

  async findSources(jobPostId: string): Promise<JobPostSourceLink[]> {
    const links = await prisma.jobPostSource.findMany({
      where: { jobPostId },
      include: {
        sourcePost: {
          select: {
            id: true,
            sourcePostId: true,
            sourceUrl: true,
            title: true,
            postedAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return links.map(toJobPostSourceLink);
  }

  async listRegions(): Promise<JobRegionGroup[]> {
    const rows = await prisma.jobPost.groupBy({
      by: ["sido", "sigungu"],
      where: { isBallet: true, sido: { not: null }, sigungu: { not: null } },
      _count: { _all: true },
      orderBy: [{ sido: "asc" }, { sigungu: "asc" }],
    });

    return groupJobRegions(rows);
  }

  private buildWhere(filter: JobPostFilterInput | null | undefined) {
    return {
      isBallet: true,
      ...(filter?.sido ? { sido: filter.sido } : {}),
      ...(filter?.sigungu ? { sigungu: filter.sigungu } : {}),
      ...(filter?.jobType ? { jobType: filter.jobType } : {}),
      ...(filter?.source ? { sourcePrimary: filter.source } : {}),
    };
  }
}
