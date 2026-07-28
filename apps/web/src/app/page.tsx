import Link from "next/link";
import { JobList } from "@/components/job-list";
import { fetchHealth, fetchJobPosts } from "@/lib/graphql/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [health, jobs] = await Promise.all([fetchHealth(), fetchJobPosts(1, 20)]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7fb_0%,#ffffff_240px)]">
      <header className="border-b border-rose-100/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <div>
            <p className="text-sm font-medium text-rose-600">Black Swan</p>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">발레 강사 구인 알림</h1>
          </div>
          <div className="rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
            공고 {health.jobCount}건
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="mb-8 rounded-3xl bg-zinc-900 px-6 py-8 text-white">
          <p className="text-sm text-zinc-300">실시간 수집 · AI 분류</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight">
            조건에 맞는 발레 공고를
            <br />
            한곳에서 확인하세요
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
            발레매니아, 이상댄스 등 외부 사이트 공고를 모아 보여줍니다. 상세 페이지에서 원본 링크로 이동할 수
            있습니다.
          </p>
        </section>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900">최신 공고</h3>
          <p className="text-sm text-zinc-500">총 {jobs.pageInfo.total}건</p>
        </div>

        <JobList jobs={jobs.items} />
      </main>
    </div>
  );
}
