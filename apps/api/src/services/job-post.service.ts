import {
  buildPageInfo,
  groupJobRegions,
  normalizePagination,
  type JobPostDetail,
  type JobPostFilterInput,
  type JobPostSourceLink,
  type JobPostSummary,
  type JobRegionGroup,
  type PaginatedResult,
  type PaginationInput,
} from "@black-swan/domain";
import { JobPostRepository } from "@black-swan/db";

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
  ): Promise<PaginatedResult<JobPostSummary>> {
    const { page, limit, skip } = normalizePagination(pagination, {
      defaultLimit: this.options.defaultPageSize,
      maxLimit: this.options.maxPageSize,
    });

    const where = this.jobPostRepository.buildWhere(filter ?? null);
    const [items, total] = await Promise.all([
      this.jobPostRepository.findMany(where, skip, limit),
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
