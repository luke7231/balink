import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SubstituteList } from "@/components/substitute-list";
import { fetchHealth, fetchSubstitutePosts } from "@/lib/graphql/queries";

export const dynamic = "force-dynamic";

type DateFilter = "all" | "today" | "tomorrow" | "week";

interface SubstitutesPageProps {
  searchParams: Promise<{
    date?: string;
    region?: string;
  }>;
}

function parseDateFilter(value?: string): DateFilter {
  return value === "today" || value === "tomorrow" || value === "week" ? value : "all";
}

function toRegionValue(sido?: string | null, sigungu?: string | null): string {
  return [sido, sigungu].filter(Boolean).join("::");
}

function filterByDate<T extends { urgency?: string | null; nextLessonAt?: string | null }>(
  posts: T[],
  dateFilter: DateFilter,
): T[] {
  if (dateFilter === "all") return posts;
  if (dateFilter === "today") return posts.filter((post) => post.urgency === "same_day");
  if (dateFilter === "tomorrow") return posts.filter((post) => post.urgency === "next_day");

  const todayInKorea = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const rangeStart = new Date(`${todayInKorea}T00:00:00+09:00`).getTime();
  const rangeEnd = rangeStart + 7 * 24 * 60 * 60 * 1000;

  return posts.filter((post) => {
    if (!post.nextLessonAt) return false;
    const lessonAt = Date.parse(post.nextLessonAt);
    return lessonAt >= rangeStart && lessonAt < rangeEnd;
  });
}

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

function buildFilterHref(dateFilter: DateFilter, region: string): string {
  const params = new URLSearchParams();
  if (dateFilter !== "all") params.set("date", dateFilter);
  if (region) params.set("region", region);
  const query = params.toString();
  return query ? `/substitutes?${query}` : "/substitutes";
}

export default async function SubstitutesPage({ searchParams }: SubstitutesPageProps) {
  const query = await searchParams;
  const dateFilter = parseDateFilter(query.date);
  const selectedRegion = query.region ?? "";
  const [health, posts] = await Promise.all([
    fetchHealth(),
    fetchSubstitutePosts(1, 100, { status: "OPEN" }),
  ]);
  const regionOptions = Array.from(
    new Map(
      posts.items
        .filter((post) => post.sido || post.sigungu)
        .map((post) => {
          const value = toRegionValue(post.sido, post.sigungu);
          const label = [post.sido, post.sigungu].filter(Boolean).join(" ");
          return [value, label] as const;
        }),
    ),
  ).sort(([, a], [, b]) => a.localeCompare(b, "ko"));
  const regionFilteredPosts = selectedRegion
    ? posts.items.filter((post) => toRegionValue(post.sido, post.sigungu) === selectedRegion)
    : posts.items;
  const filteredPosts = filterByDate(regionFilteredPosts, dateFilter);
  const sortedPosts = sortByNextLesson(filteredPosts);
  const dateOptions: Array<{ value: DateFilter; label: string }> = [
    { value: "all", label: "전체 일정" },
    { value: "today", label: "오늘" },
    { value: "tomorrow", label: "내일" },
    { value: "week", label: "7일 이내" },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffcfd_0%,#ffffff_140px)]">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section aria-label="대타 공고 필터" className="mb-8 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {dateOptions.map((option) => {
              const isSelected = dateFilter === option.value;
              return (
                <Link
                  key={option.value}
                  href={buildFilterHref(option.value, selectedRegion)}
                  aria-current={isSelected ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isSelected
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:border-rose-200 hover:text-rose-700"
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>

          <form action="/substitutes" className="mt-4 flex flex-col gap-2 sm:flex-row">
            {dateFilter !== "all" ? <input type="hidden" name="date" value={dateFilter} /> : null}
            <label className="sr-only" htmlFor="substitute-region">
              지역 선택
            </label>
            <select
              id="substitute-region"
              name="region"
              defaultValue={selectedRegion}
              className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            >
              <option value="">전체 지역</option>
              {regionOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700"
            >
              지역 적용
            </button>
            {dateFilter !== "all" || selectedRegion ? (
              <Link
                href="/substitutes"
                className="rounded-2xl px-4 py-3 text-center text-sm font-semibold text-zinc-500 hover:bg-zinc-50"
              >
                초기화
              </Link>
            ) : null}
          </form>
        </section>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900">모집 중</h3>
          <p className="text-sm text-zinc-500">
            {sortedPosts.length}건
            {sortedPosts.length !== posts.pageInfo.total ? ` / 전체 ${posts.pageInfo.total}건` : ""}
          </p>
        </div>

        <SubstituteList posts={sortedPosts} getHref={(post) => `/substitutes/${post.id}`} linkComponent={Link} />
      </main>
    </div>
  );
}
