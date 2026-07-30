import {
  buildPageInfo,
  normalizePagination,
  type PaginatedResult,
  type PaginationInput,
  type SubstitutePostDetail,
  type SubstitutePostFilterInput,
  type SubstitutePostSummary,
} from "@black-swan/domain";
import { SubstitutePostRepository } from "@black-swan/db";

export class SubstitutePostService {
  constructor(
    private readonly substitutePostRepository: SubstitutePostRepository,
    private readonly options: {
      defaultPageSize: number;
      maxPageSize: number;
    },
  ) {}

  async findMany(
    filter: SubstitutePostFilterInput | null | undefined,
    pagination: PaginationInput | null | undefined,
  ): Promise<PaginatedResult<SubstitutePostSummary>> {
    const { page, limit, skip } = normalizePagination(pagination, {
      defaultLimit: this.options.defaultPageSize,
      maxLimit: this.options.maxPageSize,
    });

    const where = this.substitutePostRepository.buildWhere(filter ?? null);
    const [items, total] = await Promise.all([
      this.substitutePostRepository.findMany(where, skip, limit),
      this.substitutePostRepository.count(where),
    ]);

    return {
      items,
      pageInfo: buildPageInfo(page, limit, total),
    };
  }

  async findById(id: string): Promise<SubstitutePostDetail | null> {
    return this.substitutePostRepository.findById(id);
  }

  async countOpenPosts(): Promise<number> {
    return this.substitutePostRepository.countOpenPosts();
  }
}
