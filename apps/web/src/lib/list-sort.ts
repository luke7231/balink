import { JobPostSort, SubstitutePostSort } from "@/generated/graphql";

export type JobSort = "latest" | "pay_high";
export type SubstituteSort = "soon" | "latest";

export const JOB_SORT_DEFAULT: JobSort = "latest";
export const SUBSTITUTE_SORT_DEFAULT: SubstituteSort = "latest";

export const JOB_SORT_OPTIONS: Array<{ value: JobSort; label: string }> = [
  { value: "latest", label: "최신순" },
  { value: "pay_high", label: "급여 높은순" },
];

export const SUBSTITUTE_SORT_OPTIONS: Array<{ value: SubstituteSort; label: string }> = [
  { value: "latest", label: "최신순" },
  { value: "soon", label: "수업 임박순" },
];

const JOB_SORTS = new Set<JobSort>(JOB_SORT_OPTIONS.map((option) => option.value));
const SUBSTITUTE_SORTS = new Set<SubstituteSort>(
  SUBSTITUTE_SORT_OPTIONS.map((option) => option.value),
);

export function parseJobSort(value?: string | string[] | null): JobSort {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  if (trimmed && JOB_SORTS.has(trimmed as JobSort)) return trimmed as JobSort;
  return JOB_SORT_DEFAULT;
}

export function parseSubstituteSort(value?: string | string[] | null): SubstituteSort {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  if (trimmed && SUBSTITUTE_SORTS.has(trimmed as SubstituteSort)) {
    return trimmed as SubstituteSort;
  }
  return SUBSTITUTE_SORT_DEFAULT;
}

export function jobSortLabel(sort: JobSort): string {
  return JOB_SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "최신순";
}

export function substituteSortLabel(sort: SubstituteSort): string {
  return SUBSTITUTE_SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "최신순";
}

/** URL/client sort → GraphQL JobPostSort */
export function toJobPostSortEnum(sort: JobSort): JobPostSort {
  return sort === "pay_high" ? JobPostSort.PayHigh : JobPostSort.Latest;
}

/** URL/client sort → GraphQL SubstitutePostSort */
export function toSubstitutePostSortEnum(sort: SubstituteSort): SubstitutePostSort {
  return sort === "latest" ? SubstitutePostSort.Latest : SubstitutePostSort.Soon;
}
