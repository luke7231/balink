import type { PageInfo, PaginationInput } from "../types/pagination.js";

export function normalizePagination(
  input: PaginationInput | null | undefined,
  defaults: { defaultLimit: number; maxLimit: number },
): { page: number; limit: number; skip: number } {
  const page = normalizePage(input?.page);
  const limit = normalizeLimit(input?.limit, defaults.defaultLimit, defaults.maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function buildPageInfo(page: number, limit: number, total: number): PageInfo {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function normalizePage(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value) || value < 1) return 1;
  return Math.floor(value);
}

function normalizeLimit(value: number | null | undefined, defaultLimit: number, maxLimit: number): number {
  if (value == null || !Number.isFinite(value) || value < 1) return defaultLimit;
  return Math.min(Math.floor(value), maxLimit);
}
