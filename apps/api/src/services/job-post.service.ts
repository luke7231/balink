import {
  buildPageInfo,
  groupJobRegions,
  normalizePagination,
  type JobPostDetail,
  type JobPostFilterInput,
  type JobPostSort,
  type JobPostSourceLink,
  type JobPostSummary,
  type JobRegionGroup,
  type PaginatedResult,
  type PaginationInput,
} from "@balink/domain";
import { JobPostRepository } from "@balink/db";

export class JobPostService {
  constructor(
    private readonly jobPostRepository: JobPostRepository,
    private readonly options: {
      defaultPageSize: number;
      maxPageSize: number;
    },
  ) {}

  async findMany(
    filter: JobPostFilterInput | null | undefined,
    pagination: PaginationInput | null | undefined,
    sort: JobPostSort | null | undefined = "LATEST",
  ): Promise<PaginatedResult<JobPostSummary>> {
    const { page, limit, skip } = normalizePagination(pagination, {
      defaultLimit: this.options.defaultPageSize,
      maxLimit: this.options.maxPageSize,
    });

    const where = this.jobPostRepository.buildWhere(filter ?? null);
    const [items, total] = await Promise.all([
      this.jobPostRepository.findMany(where, skip, limit, sort ?? "LATEST"),
      this.jobPostRepository.count(where),
    ]);

    return {
      items,
      pageInfo: buildPageInfo(page, limit, total),
    };
  }

  async findById(id: string): Promise<JobPostDetail | null> {
    return this.jobPostRepository.findById(id);
  }

  async findSources(jobPostId: string): Promise<JobPostSourceLink[]> {
    return this.jobPostRepository.findSources(jobPostId);
  }

  async listRegions(): Promise<JobRegionGroup[]> {
    const rows = await this.jobPostRepository.groupRegions();
    return groupJobRegions(rows);
  }
}
