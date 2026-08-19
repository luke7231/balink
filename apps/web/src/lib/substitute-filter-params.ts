import { toParamList } from "./job-filter-params";
import {
  SUBSTITUTE_SORT_DEFAULT,
  parseSubstituteSort,
  type SubstituteSort,
} from "./list-sort";

export type SubstituteDateFilter = "today" | "tomorrow" | "week";

const DATE_FILTERS = new Set<SubstituteDateFilter>(["today", "tomorrow", "week"]);

export function parseSubstituteDateFilters(value?: string | string[]): SubstituteDateFilter[] {
  return toParamList(value).filter((entry): entry is SubstituteDateFilter =>
    DATE_FILTERS.has(entry as SubstituteDateFilter),
  );
}

export function buildSubstituteFilterHref(
  dates: SubstituteDateFilter[],
  regions: string[],
  sort: SubstituteSort = SUBSTITUTE_SORT_DEFAULT,
): string {
  const params = new URLSearchParams();
  for (const date of dates) params.append("date", date);
  for (const region of regions) params.append("region", region);
  if (sort !== SUBSTITUTE_SORT_DEFAULT) params.set("sort", sort);
  const query = params.toString();
  return query ? `/substitutes?${query}` : "/substitutes";
}

export function parseSubstituteFilterSearchParams(searchParams: {
  get: (name: string) => string | null;
  getAll: (name: string) => string[];
}) {
  return {
    dateFilters: parseSubstituteDateFilters(searchParams.getAll("date")),
    selectedRegions: toParamList(searchParams.getAll("region")),
    sort: parseSubstituteSort(searchParams.get("sort")),
  };
}
