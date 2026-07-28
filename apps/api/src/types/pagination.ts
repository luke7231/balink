export interface PaginationInput {
  page?: number | null;
  limit?: number | null;
}

export interface PageInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pageInfo: PageInfo;
}
