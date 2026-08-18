import { HomeBanner } from "@/components/home-banner";
import { HomeFiltersClient } from "@/components/home-filters-client";
import { HomeJobsClient } from "@/components/home-jobs-client";
import { MotionReveal } from "@/components/motion-reveal";
import { SiteHeader } from "@/components/site-header";
import { SubstitutesListWarmup } from "@/components/substitutes-list-warmup";
import { HOME_BANNERS } from "@/lib/home-banners";
import type { JobPostFilterInput } from "@/generated/graphql";

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
  const hasFilter = selectedSidos.length > 0 || selectedSigungus.length > 0;
  const filter: JobPostFilterInput | null = hasFilter
    ? {
        ...(selectedSidos.length ? { sido: selectedSidos.join(",") } : {}),
        ...(selectedSigungus.length ? { sigungu: selectedSigungus.join(",") } : {}),
      }
    : null;

  return (
    <div className="home-surface home-motion min-h-full min-w-0 max-w-full overflow-x-clip page-bg">
      <MotionReveal index={0} variant="fade-in">
        <SiteHeader />
      </MotionReveal>

      <main className="mx-auto min-w-0 max-w-5xl px-4 py-8">
        <HomeBanner items={HOME_BANNERS} />
        <HomeFiltersClient selectedSidos={selectedSidos} selectedSigungus={selectedSigungus} />
        <HomeJobsClient filter={filter} hasFilter={hasFilter} />
        <SubstitutesListWarmup />
      </main>
    </div>
  );
}
