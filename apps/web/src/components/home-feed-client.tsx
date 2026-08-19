"use client";

import { HomeFiltersClient } from "@/components/home-filters-client";
import { HomeJobsClient } from "@/components/home-jobs-client";
import type { JobPostFilterInput } from "@/generated/graphql";
import { buildJobsFilterHref, parseJobFilterSearchParams } from "@/lib/job-filter-params";
import { hrefSearch, useFilterSearch } from "@/lib/use-filter-search";
import type { JobSort } from "@/lib/list-sort";

export function HomeFeedClient({
  selectedSidos: initialSidos,
  selectedSigungus: initialSigungus,
  sort: initialSort,
}: {
  selectedSidos: string[];
  selectedSigungus: string[];
  sort: JobSort;
}) {
  const search = useFilterSearch(
    hrefSearch(buildJobsFilterHref(initialSidos, initialSigungus, initialSort)),
  );
  const { selectedSidos, selectedSigungus, sort } = parseJobFilterSearchParams(
    new URLSearchParams(search),
  );
  const hasFilter = selectedSidos.length > 0 || selectedSigungus.length > 0;
  const filter: JobPostFilterInput | null = hasFilter
    ? {
        ...(selectedSidos.length ? { sido: selectedSidos.join(",") } : {}),
        ...(selectedSigungus.length ? { sigungu: selectedSigungus.join(",") } : {}),
      }
    : null;

  return (
    <>
      <HomeFiltersClient
        selectedSidos={selectedSidos}
        selectedSigungus={selectedSigungus}
        sort={sort}
      />
      <HomeJobsClient
        filter={filter}
        hasFilter={hasFilter}
        selectedSidos={selectedSidos}
        selectedSigungus={selectedSigungus}
        sort={sort}
      />
    </>
  );
}
