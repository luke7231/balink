import Link from "next/link";
import { Suspense } from "react";
import { resolveSubstituteUrgency } from "@balink/domain";
import { SiteHeader } from "@/components/site-header";
import { SubstituteList } from "@/components/substitute-list";
import { SubstitutesFilterBar } from "@/components/substitutes-filter-bar";
import { fetchHealth, fetchSubstitutePosts } from "@/lib/graphql/queries";

type DateFilter = "today" | "tomorrow" | "week";

interface SubstitutesPageProps {
  searchParams: Promise<{
    date?: string | string[];
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

function parseDateFilters(value?: string | string[]): DateFilter[] {
  const allowed = new Set<DateFilter>(["today", "tomorrow", "week"]);
  return toParamList(value).filter((entry): entry is DateFilter =>
    allowed.has(entry as DateFilter),
  );
}

function toRegionValue(sido?: string | null, sigungu?: string | null): string {
  return [sido, sigungu].filter(Boolean).join("::");
}

function liveUrgency(post: {
  sessions?: Array<{ date?: string | null; startTime?: string | null }>;
  nextLessonAt?: string | null;
}): string {
  return resolveSubstituteUrgency({
    sessions: post.sessions,
    nextLessonAt: post.nextLessonAt,
  });
}

function matchesDateFilter<
  T extends {
    urgency?: string | null;
    nextLessonAt?: string | null;
    sessions?: Array<{ date?: string | null; startTime?: string | null }>;
  },
>(post: T, dateFilter: DateFilter): boolean {
  if (dateFilter === "today") return liveUrgency(post) === "same_day";
  if (dateFilter === "tomorrow") return liveUrgency(post) === "next_day";

  const todayInKorea = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const rangeStart = new Date(`${todayInKorea}T00:00:00+09:00`).getTime();
  const rangeEnd = rangeStart + 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const upcoming = (post.sessions ?? [])
    .map((session) => {
      if (!session.date) return null;
      const time = session.startTime || "12:00";
      return Date.parse(`${session.date}T${time}:00+09:00`);
    })
    .filter((value): value is number => value != null && value >= now)
    .sort((a, b) => a - b)[0];
  const lessonAt = upcoming ?? (post.nextLessonAt ? Date.parse(post.nextLessonAt) : NaN);
  return Number.isFinite(lessonAt) && lessonAt >= rangeStart && lessonAt < rangeEnd;
}

function filterByDates<
  T extends {
    urgency?: string | null;
    nextLessonAt?: string | null;
    sessions?: Array<{ date?: string | null; startTime?: string | null }>;
  },
>(posts: T[], dateFilters: DateFilter[]): T[] {
  if (dateFilters.length === 0) return posts;
  return posts.filter((post) => dateFilters.some((filter) => matchesDateFilter(post, filter)));
}

function sortByNextLesson<
  T extends {
    urgency?: string | null;
    nextLessonAt?: string | null;
    postedAt?: string | null;
    sessions?: Array<{ date?: string | null; startTime?: string | null }>;
  },
>(posts: T[]): T[] {
  const urgencyRank = (urgency: string) =>
    urgency === "same_day" ? 0 : urgency === "next_day" ? 1 : 2;

  return posts.slice().sort((a, b) => {
    const rankDifference = urgencyRank(liveUrgency(a)) - urgencyRank(liveUrgency(b));
    if (rankDifference !== 0) return rankDifference;

    const aLesson = a.nextLessonAt ? Date.parse(a.nextLessonAt) : Number.POSITIVE_INFINITY;
    const bLesson = b.nextLessonAt ? Date.parse(b.nextLessonAt) : Number.POSITIVE_INFINITY;
    if (aLesson !== bLesson) return aLesson - bLesson;

    const aPosted = a.postedAt ? Date.parse(a.postedAt) : 0;
    const bPosted = b.postedAt ? Date.parse(b.postedAt) : 0;
    return bPosted - aPosted;
  });
}

export default async function SubstitutesPage({ searchParams }: SubstitutesPageProps) {
  const query = await searchParams;
  const dateFilters = parseDateFilters(query.date);
  const selectedRegions = toParamList(query.region);
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
  const regionSet = new Set(selectedRegions);
  const regionFilteredPosts =
    selectedRegions.length > 0
      ? posts.items.filter((post) => regionSet.has(toRegionValue(post.sido, post.sigungu)))
      : posts.items;
  const filteredPosts = filterByDates(regionFilteredPosts, dateFilters);
  const sortedPosts = sortByNextLesson(filteredPosts);

  return (
    <div className="min-h-full min-w-0 max-w-full overflow-x-clip page-bg">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto min-w-0 max-w-5xl px-4 py-8">
        <Suspense fallback={<div className="mb-6 h-10" aria-hidden="true" />}>
          <SubstitutesFilterBar
            dateFilters={dateFilters}
            selectedRegions={selectedRegions}
            regionOptions={regionOptions}
          />
        </Suspense>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">모집 중</h3>
          <p className="text-sm text-muted-foreground">
            {sortedPosts.length}건
            {sortedPosts.length !== posts.pageInfo.total ? ` / 전체 ${posts.pageInfo.total}건` : ""}
          </p>
        </div>

        <SubstituteList posts={sortedPosts} getHref={(post) => `/substitutes/${post.id}`} linkComponent={Link} />
      </main>
    </div>
  );
}
