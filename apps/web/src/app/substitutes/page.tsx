import { SiteHeader } from "@/components/site-header";
import { SubstitutesClient } from "@/components/substitutes-client";
import { toParamList } from "@/lib/job-filter-params";
import { parseSubstituteSort } from "@/lib/list-sort";
import { parseSubstituteDateFilters } from "@/lib/substitute-filter-params";

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
