import { Suspense } from "react";
import { HomeBanner } from "@/components/home-banner";
import { HomeJobList, HomeJobListFallback } from "@/components/home-job-list";
import { JobsFilterBar } from "@/components/jobs-filter-bar";
import { SiteHeader } from "@/components/site-header";
import { fetchHealth, fetchJobPosts, fetchJobRegions } from "@/lib/graphql/queries";
import { HOME_BANNERS } from "@/lib/home-banners";

interface HomePageProps {
  searchParams: Promise<{
    sido?: string;
    sigungu?: string;
    region?: string;
  }>;
}

function parseRegionParams(query: { sido?: string; sigungu?: string; region?: string }) {
  const [regionSido, regionSigungu] = (query.region ?? "").split("::");
  const selectedSido = query.sido?.trim() || regionSido?.trim() || "";
  const selectedSigungu = query.sigungu?.trim() || regionSigungu?.trim() || "";
  return { selectedSido, selectedSigungu };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const query = await searchParams;
  const { selectedSido, selectedSigungu } = parseRegionParams(query);
  const filter = {
    ...(selectedSido ? { sido: selectedSido } : {}),
    ...(selectedSigungu ? { sigungu: selectedSigungu } : {}),
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
  const hasFilter = Boolean(selectedSido || selectedSigungu);

  return (
    <div className="min-h-full min-w-0 max-w-full overflow-x-clip page-bg">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto min-w-0 max-w-5xl px-4 py-8">
        <HomeBanner items={HOME_BANNERS} />

        <Suspense fallback={<div className="mb-6 h-10" aria-hidden="true" />}>
          <JobsFilterBar
            regions={regionOptions}
            selectedSido={selectedSido}
            selectedSigungu={selectedSigungu}
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
