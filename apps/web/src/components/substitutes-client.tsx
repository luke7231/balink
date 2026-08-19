"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { resolveSubstituteUrgency } from "@balink/domain";
import { SoftContentSwap } from "@/components/soft-content-swap";
import { SubstituteList, type SubstituteCardData } from "@/components/substitute-list";
import { SubstitutesFallback } from "@/components/substitutes-fallback";
import { SubstitutesFilterBar } from "@/components/substitutes-filter-bar";
import {
  SubstitutePostsDocument,
  type SubstitutePostsQuery,
} from "@/generated/graphql";
import { browserGraphqlRequest } from "@/lib/graphql/browser-client";
import { readListCache, writeListCache } from "@/lib/list-cache";

type DateFilter = "today" | "tomorrow" | "week";

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

function matchesDateFilter(post: SubstituteCardData, dateFilter: DateFilter): boolean {
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

function sortByNextLesson(posts: SubstituteCardData[]): SubstituteCardData[] {
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

type CachedSubstitutes = {
  items: SubstituteCardData[];
  total: number;
};

const CACHE_KEY = "substitute-posts-open";

export function SubstitutesClient({
  dateFilters,
  selectedRegions,
}: {
  dateFilters: DateFilter[];
  selectedRegions: string[];
}) {
  const hasFilter = dateFilters.length > 0 || selectedRegions.length > 0;
  const [raw, setRaw] = useState<CachedSubstitutes | null>(null);

  useEffect(() => {
    const cached = readListCache<CachedSubstitutes>(CACHE_KEY);
    if (cached) setRaw(cached);

    let cancelled = false;
    void (async () => {
      try {
        const result = await browserGraphqlRequest<SubstitutePostsQuery>(SubstitutePostsDocument, {
          pagination: { page: 1, limit: 100 },
          filter: { status: "OPEN" },
        });
        if (cancelled) return;
        const next = {
          items: result.substitutePosts.items as SubstituteCardData[],
          total: result.substitutePosts.pageInfo.total,
        };
        writeListCache(CACHE_KEY, next);
        // 무거운 리스트 커밋이 쉬머를 멈추지 않게 전환을 낮춤
        startTransition(() => {
          setRaw(next);
        });
      } catch {
        // keep cache
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const view = useMemo(() => {
    if (!raw) return null;
    const regionOptions = Array.from(
      new Map(
        raw.items
          .filter((post) => post.sido || post.sigungu)
          .map((post) => {
            const value = toRegionValue(post.sido, post.sigungu);
            const label = [post.sido, post.sigungu].filter(Boolean).join(" ");
            return [value, label] as const;
          }),
      ),
    ).sort(([, a], [, b]) => a.localeCompare(b, "ko"));

    const regionSet = new Set(selectedRegions);
    let items =
      selectedRegions.length > 0
        ? raw.items.filter((post) => regionSet.has(toRegionValue(post.sido, post.sigungu)))
        : raw.items;
    if (dateFilters.length > 0) {
      items = items.filter((post) => dateFilters.some((filter) => matchesDateFilter(post, filter)));
    }
    items = sortByNextLesson(items);
    return { items, total: raw.total, regionOptions };
  }, [raw, dateFilters, selectedRegions]);

  const skeleton = useMemo(
    () => <SubstitutesFallback hasFilter={hasFilter} />,
    [hasFilter],
  );

  return (
    <SoftContentSwap ready={view != null} skeleton={skeleton}>
      {view ? (
        <>
          <SubstitutesFilterBar
            dateFilters={dateFilters}
            selectedRegions={selectedRegions}
            regionOptions={view.regionOptions}
          />
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">모집 중</h3>
            <p className="text-sm text-muted-foreground">
              {view.items.length}건
              {view.items.length !== view.total ? ` / 전체 ${view.total}건` : ""}
            </p>
          </div>
          <SubstituteList
            posts={view.items}
            getHref={(post) => `/substitutes/${post.id}`}
            linkComponent={Link}
          />
        </>
      ) : null}
    </SoftContentSwap>
  );
}
