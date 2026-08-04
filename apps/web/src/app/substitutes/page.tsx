import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SubstituteList } from "@/components/substitute-list";
import { fetchHealth, fetchSubstitutePosts } from "@/lib/graphql/queries";

export const dynamic = "force-dynamic";

function sortByNextLesson<
  T extends { urgency?: string | null; nextLessonAt?: string | null; postedAt?: string | null },
>(posts: T[]): T[] {
  const urgencyRank = (urgency?: string | null) =>
    urgency === "same_day" ? 0 : urgency === "next_day" ? 1 : 2;

  return posts.slice().sort((a, b) => {
    const rankDifference = urgencyRank(a.urgency) - urgencyRank(b.urgency);
    if (rankDifference !== 0) return rankDifference;

    const aLesson = a.nextLessonAt ? Date.parse(a.nextLessonAt) : Number.POSITIVE_INFINITY;
    const bLesson = b.nextLessonAt ? Date.parse(b.nextLessonAt) : Number.POSITIVE_INFINITY;
    if (aLesson !== bLesson) return aLesson - bLesson;

    const aPosted = a.postedAt ? Date.parse(a.postedAt) : 0;
    const bPosted = b.postedAt ? Date.parse(b.postedAt) : 0;
    return bPosted - aPosted;
  });
}

export default async function SubstitutesPage() {
  const [health, posts] = await Promise.all([
    fetchHealth(),
    fetchSubstitutePosts(1, 20, { status: "OPEN" }),
  ]);
  const sortedPosts = sortByNextLesson(posts.items);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7fb_0%,#ffffff_240px)]">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="mb-8 rounded-3xl bg-zinc-900 px-6 py-8 text-white">
          <h2 className="text-2xl font-semibold leading-tight">
            급구 대타 공고를
            <br />
            빠르게 확인하세요
          </h2>
        </section>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900">모집 중</h3>
          <p className="text-sm text-zinc-500">총 {posts.pageInfo.total}건</p>
        </div>

        <SubstituteList posts={sortedPosts} getHref={(post) => `/substitutes/${post.id}`} linkComponent={Link} />
      </main>
    </div>
  );
}
