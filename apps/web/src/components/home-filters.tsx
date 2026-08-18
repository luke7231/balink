import { JobsFilterBar } from "@/components/jobs-filter-bar";
import { fetchJobRegions } from "@/lib/graphql/queries";

export function HomeFiltersFallback() {
  return (
    <div className="mb-6 flex gap-2 overflow-hidden" aria-hidden="true">
      <div className="motion-shimmer h-10 w-16 shrink-0 rounded-full" />
      <div className="motion-shimmer h-10 w-24 shrink-0 rounded-full" />
      <div className="motion-shimmer h-10 w-28 shrink-0 rounded-full" />
      <div className="motion-shimmer h-10 w-20 shrink-0 rounded-full" />
    </div>
  );
}

export async function HomeFilters({
  selectedSidos,
  selectedSigungus,
}: {
  selectedSidos: string[];
  selectedSigungus: string[];
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
    />
  );
}
