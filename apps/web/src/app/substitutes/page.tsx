import { SiteHeader } from "@/components/site-header";
import { SubstitutesClient } from "@/components/substitutes-client";

type DateFilter = "today" | "tomorrow" | "week";

interface SubstitutesPageProps {
  searchParams: Promise<{
    date?: string | string[];
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

function parseDateFilters(value?: string | string[]): DateFilter[] {
  const allowed = new Set<DateFilter>(["today", "tomorrow", "week"]);
  return toParamList(value).filter((entry): entry is DateFilter =>
    allowed.has(entry as DateFilter),
  );
}

export default async function SubstitutesPage({ searchParams }: SubstitutesPageProps) {
  const query = await searchParams;
  const dateFilters = parseDateFilters(query.date);
  const selectedRegions = toParamList(query.region);

  return (
    <div className="min-h-full min-w-0 max-w-full overflow-x-clip page-bg">
      <SiteHeader />

      <main className="mx-auto min-w-0 max-w-5xl px-4 py-8">
        <SubstitutesClient dateFilters={dateFilters} selectedRegions={selectedRegions} />
      </main>
    </div>
  );
}
