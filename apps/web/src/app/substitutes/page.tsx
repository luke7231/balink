import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SubstituteList } from "@/components/substitute-list";
import { fetchHealth, fetchSubstitutePosts } from "@/lib/graphql/queries";

export const dynamic = "force-dynamic";

export default async function SubstitutesPage() {
  const [health, posts] = await Promise.all([
    fetchHealth(),
    fetchSubstitutePosts(1, 20, { status: "OPEN" }),
  ]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7fb_0%,#ffffff_240px)]">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="mb-8 rounded-3xl bg-zinc-900 px-6 py-8 text-white">
          <p className="text-sm text-zinc-300">발레매니아 대타 구인</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight">
            급구 대타 공고를
            <br />
            빠르게 확인하세요
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
            외부 대타 게시판 최신 글을 모아 보여줍니다. 상세에서 연락처와 원문 링크를 확인할 수 있습니다.
          </p>
        </section>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900">모집 중</h3>
          <p className="text-sm text-zinc-500">총 {posts.pageInfo.total}건</p>
        </div>

        <SubstituteList posts={posts.items} getHref={(post) => `/substitutes/${post.id}`} linkComponent={Link} />
      </main>
    </div>
  );
}
