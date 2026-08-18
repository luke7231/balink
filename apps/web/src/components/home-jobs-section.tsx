import { Suspense } from "react";
import type { JobPostFilterInput } from "@/generated/graphql";
import { HomeJobList, HomeJobListFallback } from "@/components/home-job-list";
import { HomeJobsSectionFallback } from "@/components/home-fallbacks";
import { fetchJobPosts } from "@/lib/graphql/queries";

export { HomeJobsSectionFallback };

export async function HomeJobsSection({
  filter,
  hasFilter,
}: {
  filter: JobPostFilterInput | null;
  hasFilter: boolean;
}) {
  const jobs = await fetchJobPosts(1, 40, filter);

  return (
    <>
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
    </>
  );
}
