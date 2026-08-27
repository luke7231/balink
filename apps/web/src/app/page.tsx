import type { Metadata } from "next";
import { HomeBanner } from "@/components/home-banner";
import { HomeFeedClient } from "@/components/home-feed-client";
import { MotionReveal } from "@/components/motion-reveal";
import { SiteHeader } from "@/components/site-header";
import { SubstitutesListWarmup } from "@/components/substitutes-list-warmup";
import { HOME_BANNERS } from "@/lib/home-banners";
import { parseJobFilterParams } from "@/lib/job-filter-params";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "발레 강사 채용",
  description:
    "발레 강사 채용 공고를 지역·조건별로 모았습니다. 발링크에서 커리어에 맞는 학원·기관 공고를 확인하세요.",
  path: "/",
});

interface HomePageProps {
  searchParams: Promise<{
    sido?: string | string[];
    sigungu?: string | string[];
    region?: string | string[];
    sort?: string | string[];
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const query = await searchParams;
  const { selectedSidos, selectedSigungus, sort } = parseJobFilterParams(query);

  return (
    <div className="home-surface home-motion min-h-full min-w-0 max-w-full overflow-x-clip page-bg">
      <MotionReveal index={0} variant="fade-in">
        <SiteHeader />
      </MotionReveal>

      <main className="mx-auto min-w-0 max-w-5xl px-4 py-8">
        <HomeBanner items={HOME_BANNERS} />
        <HomeFeedClient
          selectedSidos={selectedSidos}
          selectedSigungus={selectedSigungus}
          sort={sort}
        />
        <SubstitutesListWarmup />
      </main>
    </div>
  );
}
