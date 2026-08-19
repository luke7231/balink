"use client";

import { useEffect, useState } from "react";
import { JobsFilterBar } from "@/components/jobs-filter-bar";
import { HomeFiltersFallback } from "@/components/home-fallbacks";
import { MotionReveal } from "@/components/motion-reveal";
import {
  JobRegionsDocument,
  type JobRegionsQuery,
} from "@/generated/graphql";
import { browserGraphqlRequest } from "@/lib/graphql/browser-client";
import { readListCache, writeListCache } from "@/lib/list-cache";

type RegionOption = {
  sido: string;
  count: number;
  districts: Array<{ sigungu: string; count: number }>;
};

const CACHE_KEY = "job-regions";

function toRegionOptions(regions: JobRegionsQuery["jobRegions"]): RegionOption[] {
  return regions.map((region) => ({
    sido: region.sido,
    count: region.districts.reduce((sum, district) => sum + district.count, 0),
    districts: region.districts,
  }));
}

export function HomeFiltersClient({
  selectedSidos,
  selectedSigungus,
  sort,
}: {
  selectedSidos: string[];
  selectedSigungus: string[];
  sort: import("@/lib/list-sort").JobSort;
}) {
  const [regions, setRegions] = useState<RegionOption[] | null>(null);

  useEffect(() => {
    const cached = readListCache<RegionOption[]>(CACHE_KEY);
    if (cached) setRegions(cached);

    let cancelled = false;
    void (async () => {
      try {
        const data = await browserGraphqlRequest<JobRegionsQuery>(JobRegionsDocument);
        if (cancelled) return;
        const next = toRegionOptions(data.jobRegions);
        setRegions(next);
        writeListCache(CACHE_KEY, next);
      } catch {
        // keep cached / empty
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!regions) {
    return (
      <MotionReveal index={2} variant="fade-in" remountKey="filters-loading">
        <HomeFiltersFallback />
      </MotionReveal>
    );
  }

  return (
    <MotionReveal index={2} variant="soft-scale" remountKey={`filters-${regions.length}`}>
      <JobsFilterBar
        regions={regions}
        selectedSidos={selectedSidos}
        selectedSigungus={selectedSigungus}
        sort={sort}
      />
    </MotionReveal>
  );
}
