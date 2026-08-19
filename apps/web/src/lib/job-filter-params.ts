import {
  JOB_SORT_DEFAULT,
  parseJobSort,
  type JobSort,
} from "./list-sort";

export function toParamList(value?: string | string[] | null): string[] {
  if (!value) return [];
  const entries = Array.isArray(value) ? value : [value];
  return entries
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function parseJobFilterParams(query: {
  sido?: string | string[];
  sigungu?: string | string[];
  region?: string | string[];
  sort?: string | string[];
}) {
  const selectedSidos = toParamList(query.sido);
  const selectedSigungus = toParamList(query.sigungu);
  const sort = parseJobSort(query.sort);

  if (selectedSidos.length || selectedSigungus.length) {
    return { selectedSidos, selectedSigungus, sort };
  }

  const regionValue = toParamList(query.region)[0] ?? "";
  const [regionSido, regionSigungu] = regionValue.split("::");
  return {
    selectedSidos: regionSido?.trim() ? [regionSido.trim()] : [],
    selectedSigungus: regionSigungu?.trim() ? [regionSigungu.trim()] : [],
    sort,
  };
}

export function parseJobFilterSearchParams(searchParams: {
  get: (name: string) => string | null;
  getAll: (name: string) => string[];
}) {
  return parseJobFilterParams({
    sido: searchParams.getAll("sido"),
    sigungu: searchParams.getAll("sigungu"),
    region: searchParams.getAll("region"),
    sort: searchParams.get("sort") ?? undefined,
  });
}

export function buildJobsFilterHref(
  sidos: string[],
  sigungus: string[],
  sort: JobSort = JOB_SORT_DEFAULT,
): string {
  const params = new URLSearchParams();
  for (const sido of sidos) params.append("sido", sido);
  for (const sigungu of sigungus) params.append("sigungu", sigungu);
  if (sort !== JOB_SORT_DEFAULT) params.set("sort", sort);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
