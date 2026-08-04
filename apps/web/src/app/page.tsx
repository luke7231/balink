import Link from "next/link";
import { JobList } from "@black-swan/ui/job-list";
import { SiteHeader } from "@/components/site-header";
import { fetchHealth, fetchJobPosts } from "@/lib/graphql/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [health, jobs] = await Promise.all([fetchHealth(), fetchJobPosts(1, 20)]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7fb_0%,#ffffff_240px)]">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="mb-8 rounded-3xl bg-zinc-900 px-6 py-8 text-white">
          <h2 className="text-2xl font-semibold leading-tight">
            조건에 맞는 발레 공고를
            <br />
            한곳에서 확인하세요
          </h2>
        </section>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900">최신 공고</h3>
          <p className="text-sm text-zinc-500">총 {jobs.pageInfo.total}건</p>
        </div>

        <JobList
          jobs={jobs.items}
          getHref={(job) => `/jobs/${job.id}`}
          linkComponent={Link}
        />
      </main>
    </div>
  );
}
