import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SubstitutesClient } from "@/components/substitutes-client";
import { toParamList } from "@/lib/job-filter-params";
import { parseSubstituteSort } from "@/lib/list-sort";
import { buildPageMetadata } from "@/lib/seo";
import { parseSubstituteDateFilters } from "@/lib/substitute-filter-params";

export const metadata: Metadata = buildPageMetadata({
  title: "발레 대강",
  description:
    "발레 대강(대타) 요청을 모아 보여 줍니다. 일정·지역에 맞는 급구 수업을 발링크에서 확인하세요.",
  path: "/substitutes",
});

interface SubstitutesPageProps {
  searchParams: Promise<{
    date?: string | string[];
    region?: string | string[];
    sort?: string | string[];
  }>;
}

export default async function SubstitutesPage({ searchParams }: SubstitutesPageProps) {
  const query = await searchParams;
  const dateFilters = parseSubstituteDateFilters(query.date);
  const selectedRegions = toParamList(query.region);
  const sort = parseSubstituteSort(query.sort);

  return (
    <div className="home-surface min-h-full min-w-0 max-w-full overflow-x-clip page-bg">
      <SiteHeader />

      <main className="mx-auto min-w-0 max-w-5xl px-4 py-8">
        <SubstitutesClient
          dateFilters={dateFilters}
          selectedRegions={selectedRegions}
          sort={sort}
        />
      </main>
    </div>
  );
}
