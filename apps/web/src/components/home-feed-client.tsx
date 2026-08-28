"use client";

import { HomeFiltersClient } from "@/components/home-filters-client";
import { HomeJobsClient } from "@/components/home-jobs-client";
import { ListSearchField } from "@/components/list-search-field";
import type { JobPostFilterInput } from "@/generated/graphql";
import { setFilterUrl } from "@/lib/filter-url";
import {
  buildJobsFilterHref,
  parseJobFilterSearchParams,
} from "@/lib/job-filter-params";
import { hrefSearch, useFilterSearch } from "@/lib/use-filter-search";
import type { JobSort } from "@/lib/list-sort";

export function HomeFeedClient({
  selectedSidos: initialSidos,
  selectedSigungus: initialSigungus,
  sort: initialSort,
  q: initialQ,
}: {
  selectedSidos: string[];
  selectedSigungus: string[];
  sort: JobSort;
  q: string;
}) {
  const search = useFilterSearch(
    hrefSearch(buildJobsFilterHref(initialSidos, initialSigungus, initialSort, initialQ)),
  );
  const { selectedSidos, selectedSigungus, sort, q } = parseJobFilterSearchParams(
    new URLSearchParams(search),
  );
  const hasRegionFilter = selectedSidos.length > 0 || selectedSigungus.length > 0;
  const hasFilter = hasRegionFilter || q.length > 0;
  const filter: JobPostFilterInput | null = hasFilter
    ? {
        ...(selectedSidos.length ? { sido: selectedSidos.join(",") } : {}),
        ...(selectedSigungus.length ? { sigungu: selectedSigungus.join(",") } : {}),
        ...(q ? { q } : {}),
      }
    : null;

  return (
    <>
      <ListSearchField
        value={q}
        onChange={(next) => {
          setFilterUrl(
            buildJobsFilterHref(selectedSidos, selectedSigungus, sort, next),
          );
        }}
      />
      <HomeFiltersClient
        selectedSidos={selectedSidos}
        selectedSigungus={selectedSigungus}
        sort={sort}
        q={q}
      />
      <HomeJobsClient
        filter={filter}
        hasFilter={hasFilter}
        hasRegionFilter={hasRegionFilter}
        selectedSidos={selectedSidos}
        selectedSigungus={selectedSigungus}
        sort={sort}
        q={q}
      />
    </>
  );
}
