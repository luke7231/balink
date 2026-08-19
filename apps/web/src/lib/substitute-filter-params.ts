import { toParamList } from "./job-filter-params";

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
): string {
  const params = new URLSearchParams();
  for (const date of dates) params.append("date", date);
  for (const region of regions) params.append("region", region);
  const query = params.toString();
  return query ? `/substitutes?${query}` : "/substitutes";
}
