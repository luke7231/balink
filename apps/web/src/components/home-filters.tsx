import { JobsFilterBar } from "@/components/jobs-filter-bar";
import { SkeletonChip } from "@/components/skeleton-block";
import { fetchJobRegions } from "@/lib/graphql/queries";
import { JOB_SORT_DEFAULT } from "@/lib/list-sort";

export function HomeFiltersFallback() {
  return (
    <div className="mb-6 flex gap-2 overflow-hidden" aria-hidden="true">
      <SkeletonChip index={0} className="h-10 w-16 rounded-full" />
      <SkeletonChip index={1} className="h-10 w-24 rounded-full" />
      <SkeletonChip index={2} className="h-10 w-28 rounded-full" />
      <SkeletonChip index={3} className="h-10 w-20 rounded-full" />
    </div>
  );
}

export async function HomeFilters({
  selectedSidos,
  selectedSigungus,
  q = "",
}: {
  selectedSidos: string[];
  selectedSigungus: string[];
  q?: string;
}) {
  const regions = await fetchJobRegions();
  const regionOptions = regions.map((region) => ({
    sido: region.sido,
    count: region.districts.reduce((sum, district) => sum + district.count, 0),
    districts: region.districts,
  }));

  return (
    <JobsFilterBar
      regions={regionOptions}
      selectedSidos={selectedSidos}
      selectedSigungus={selectedSigungus}
      sort={JOB_SORT_DEFAULT}
      q={q}
    />
  );
}
