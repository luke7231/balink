import { Suspense } from "react";
import { HomeBanner } from "@/components/home-banner";
import { HomeJobList, HomeJobListFallback } from "@/components/home-job-list";
import { JobsFilterBar } from "@/components/jobs-filter-bar";
import { SiteHeader } from "@/components/site-header";
import { fetchHealth, fetchJobPosts, fetchJobRegions } from "@/lib/graphql/queries";
import { HOME_BANNERS } from "@/lib/home-banners";

interface HomePageProps {
  searchParams: Promise<{
    sido?: string | string[];
    sigungu?: string | string[];
    region?: string | string[];
  }>;
}

function toParamList(value?: string | string[]): string[] {
  if (!value) return [];
  const entries = Array.isArray(value) ? value : [value];
  return entries
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseRegionParams(query: {
  sido?: string | string[];
  sigungu?: string | string[];
  region?: string | string[];
}) {
  const selectedSidos = toParamList(query.sido);
  const selectedSigungus = toParamList(query.sigungu);

  if (selectedSidos.length || selectedSigungus.length) {
    return { selectedSidos, selectedSigungus };
  }

  const regionValue = toParamList(query.region)[0] ?? "";
  const [regionSido, regionSigungu] = regionValue.split("::");
  return {
    selectedSidos: regionSido?.trim() ? [regionSido.trim()] : [],
    selectedSigungus: regionSigungu?.trim() ? [regionSigungu.trim()] : [],
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const query = await searchParams;
  const { selectedSidos, selectedSigungus } = parseRegionParams(query);
  const filter = {
    ...(selectedSidos.length ? { sido: selectedSidos.join(",") } : {}),
    ...(selectedSigungus.length ? { sigungu: selectedSigungus.join(",") } : {}),
  };

  const [health, jobs, regions] = await Promise.all([
    fetchHealth(),
    fetchJobPosts(1, 40, Object.keys(filter).length ? filter : null),
    fetchJobRegions(),
  ]);

  const regionOptions = regions.map((region) => ({
    sido: region.sido,
    count: region.districts.reduce((sum, district) => sum + district.count, 0),
    districts: region.districts,
  }));
  const hasFilter = selectedSidos.length > 0 || selectedSigungus.length > 0;

  return (
    <div className="min-h-full min-w-0 max-w-full overflow-x-clip page-bg">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto min-w-0 max-w-5xl px-4 py-8">
        <HomeBanner items={HOME_BANNERS} />

        <Suspense fallback={<div className="mb-6 h-10" aria-hidden="true" />}>
          <JobsFilterBar
            regions={regionOptions}
            selectedSidos={selectedSidos}
            selectedSigungus={selectedSigungus}
          />
        </Suspense>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">최신 공고</h3>
          <p className="text-sm text-muted-foreground">
            {jobs.pageInfo.total}건
            {hasFilter ? " · 필터 적용" : ""}
          </p>
        </div>

        <Suspense fallback={<HomeJobListFallback jobs={jobs.items} />}>
          <HomeJobList jobs={jobs.items} />
        </Suspense>
      </main>
    </div>
  );
}
