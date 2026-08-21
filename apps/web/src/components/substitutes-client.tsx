"use client";

import Link from "next/link";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { resolveSubstituteUrgency } from "@balink/domain";
import { ListSortControl } from "@/components/list-sort-control";
import { getBookmarkedSubstituteIdsAction } from "@/components/bookmark-actions";
import { BookmarkButton } from "@/components/bookmark-button";
import { SkeletonCard } from "@/components/skeleton-block";
import { SoftContentSwap } from "@/components/soft-content-swap";
import {
  SubstituteList,
  type SubstituteCardData,
} from "@/components/substitute-list";
import { SubstitutesFallback } from "@/components/substitutes-fallback";
import { SubstitutesFilterBar } from "@/components/substitutes-filter-bar";
import {
  SubstitutePostsDocument,
  type SubstitutePostsQuery,
} from "@/generated/graphql";
import { setFilterUrl } from "@/lib/filter-url";
import { browserGraphqlRequest } from "@/lib/graphql/browser-client";
import { readListCache, writeListCache } from "@/lib/list-cache";
import {
  SUBSTITUTE_SORT_OPTIONS,
  toSubstitutePostSortEnum,
  type SubstituteSort,
} from "@/lib/list-sort";
import {
  buildSubstituteFilterHref,
  parseSubstituteFilterSearchParams,
  type SubstituteDateFilter,
} from "@/lib/substitute-filter-params";
import { hrefSearch, useFilterSearch } from "@/lib/use-filter-search";

const PAGE_SIZE = 20;

type DateFilter = SubstituteDateFilter;

type CachedSubstitutes = {
  items: SubstituteCardData[];
  total: number;
};

type SubstitutesState = {
  items: SubstituteCardData[];
  page: number;
  total: number;
  hasMore: boolean;
};

function cacheKey(sort: SubstituteSort): string {
  return `substitute-posts-open:${sort}:${PAGE_SIZE}`;
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

function matchesDateFilter(
  post: SubstituteCardData,
  dateFilter: DateFilter,
): boolean {
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
  const lessonAt =
    upcoming ?? (post.nextLessonAt ? Date.parse(post.nextLessonAt) : NaN);
  return (
    Number.isFinite(lessonAt) && lessonAt >= rangeStart && lessonAt < rangeEnd
  );
}

function appendUnique(
  existing: SubstituteCardData[],
  incoming: SubstituteCardData[],
): SubstituteCardData[] {
  if (incoming.length === 0) return existing;
  const seen = new Set(existing.map((post) => post.id));
  const next = [...existing];
  for (const post of incoming) {
    if (seen.has(post.id)) continue;
    seen.add(post.id);
    next.push(post);
  }
  return next;
}

function toSubstitutesState(
  items: SubstituteCardData[],
  page: number,
  total: number,
  totalPages: number,
): SubstitutesState {
  return {
    items,
    page,
    total,
    hasMore: page < totalPages,
  };
}

export function SubstitutesClient({
  dateFilters: initialDateFilters,
  selectedRegions: initialSelectedRegions,
  sort: initialSort,
}: {
  dateFilters: DateFilter[];
  selectedRegions: string[];
  sort: SubstituteSort;
}) {
  const search = useFilterSearch(
    hrefSearch(
      buildSubstituteFilterHref(
        initialDateFilters,
        initialSelectedRegions,
        initialSort,
      ),
    ),
  );
  const { dateFilters, selectedRegions, sort } =
    parseSubstituteFilterSearchParams(new URLSearchParams(search));
  const hasFilter = dateFilters.length > 0 || selectedRegions.length > 0;
  const key = cacheKey(sort);
  const [data, setData] = useState<SubstitutesState | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const loadMoreErrorRef = useRef(false);
  const keyRef = useRef(key);
  const dataRef = useRef(data);
  keyRef.current = key;
  dataRef.current = data;

  const mergeBookmarks = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      const bookmarked = await getBookmarkedSubstituteIdsAction(ids);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        for (const id of bookmarked) next.add(id);
        return next;
      });
    } catch {
      // keep previous bookmarks
    }
  }, []);

  useEffect(() => {
    const cached = readListCache<CachedSubstitutes>(key);
    if (cached) {
      setData(
        toSubstitutesState(
          cached.items,
          1,
          cached.total,
          Math.max(1, Math.ceil(cached.total / PAGE_SIZE)),
        ),
      );
      setBookmarkedIds(new Set());
      void mergeBookmarks(cached.items.map((post) => post.id));
    } else {
      setData(null);
      setBookmarkedIds(new Set());
    }
    loadingMoreRef.current = false;
    loadMoreErrorRef.current = false;
    setLoadingMore(false);
    setLoadMoreError(false);

    let cancelled = false;
    void (async () => {
      try {
        const result = await browserGraphqlRequest<SubstitutePostsQuery>(
          SubstitutePostsDocument,
          {
            pagination: { page: 1, limit: PAGE_SIZE },
            filter: { status: "OPEN" },
            sort: toSubstitutePostSortEnum(sort),
          },
        );
        if (cancelled) return;
        const { items, pageInfo } = result.substitutePosts;
        const next = toSubstitutesState(
          items as SubstituteCardData[],
          pageInfo.page,
          pageInfo.total,
          pageInfo.totalPages,
        );
        writeListCache(key, { items: next.items, total: next.total });
        startTransition(() => {
          setData(next);
          setBookmarkedIds(new Set());
          loadMoreErrorRef.current = false;
          setLoadMoreError(false);
        });
        void mergeBookmarks(next.items.map((post) => post.id));
      } catch {
        // keep cache
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, sort, mergeBookmarks]);

  const loadNextPage = useCallback(async () => {
    const current = dataRef.current;
    if (!current?.hasMore || loadingMoreRef.current || loadMoreErrorRef.current)
      return;

    const requestKey = key;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = current.page + 1;

    try {
      const result = await browserGraphqlRequest<SubstitutePostsQuery>(
        SubstitutePostsDocument,
        {
          pagination: { page: nextPage, limit: PAGE_SIZE },
          filter: { status: "OPEN" },
          sort: toSubstitutePostSortEnum(sort),
        },
      );
      if (requestKey !== keyRef.current) return;
      const { items, pageInfo } = result.substitutePosts;
      const existingIds = new Set(current.items.map((post) => post.id));
      const merged = appendUnique(
        current.items,
        items as SubstituteCardData[],
      );
      setData(
        toSubstitutesState(
          merged,
          pageInfo.page,
          pageInfo.total,
          pageInfo.totalPages,
        ),
      );
      const newIds = (items as SubstituteCardData[])
        .map((post) => post.id)
        .filter((id) => !existingIds.has(id));
      void mergeBookmarks(newIds);
    } catch {
      if (requestKey !== keyRef.current) return;
      loadMoreErrorRef.current = true;
      setLoadMoreError(true);
    } finally {
      if (requestKey === keyRef.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [key, sort, mergeBookmarks]);

  const view = useMemo(() => {
    if (!data) return null;
    const regionOptions = Array.from(
      new Map(
        data.items
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
        ? data.items.filter((post) =>
            regionSet.has(toRegionValue(post.sido, post.sigungu)),
          )
        : data.items;
    if (dateFilters.length > 0) {
      items = items.filter((post) =>
        dateFilters.some((filter) => matchesDateFilter(post, filter)),
      );
    }
    return { items, total: data.total, regionOptions, hasMore: data.hasMore };
  }, [data, dateFilters, selectedRegions]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !view?.hasMore || loadMoreError) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadNextPage();
        }
      },
      { root: null, rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [view?.hasMore, loadMoreError, loadNextPage, view?.items.length]);

  // 일정·지역 필터로 화면이 비면, 스크롤 전에 다음 페이지를 이어서 채운다
  useEffect(() => {
    if (!hasFilter || !view?.hasMore || loadingMore || loadMoreError) return;
    if (view.items.length >= PAGE_SIZE) return;
    void loadNextPage();
  }, [
    hasFilter,
    view?.hasMore,
    view?.items.length,
    loadingMore,
    loadMoreError,
    loadNextPage,
  ]);

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
            sort={sort}
          />
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground">모집 중</h3>
            <div className="flex shrink-0 items-center gap-2">
              <ListSortControl
                value={sort}
                options={SUBSTITUTE_SORT_OPTIONS}
                sheetTitle="정렬"
                ariaLabel="대강 공고 정렬"
                onChange={(nextSort) => {
                  setFilterUrl(
                    buildSubstituteFilterHref(
                      dateFilters,
                      selectedRegions,
                      nextSort,
                    ),
                  );
                }}
              />
              <p className="text-sm text-muted-foreground">
                {hasFilter ? (
                  <>
                    {view.items.length}건
                    {view.items.length !== view.total
                      ? ` / 전체 ${view.total}건`
                      : ""}
                  </>
                ) : (
                  <>{view.total}건</>
                )}
              </p>
            </div>
          </div>
          <SubstituteList
            posts={view.items}
            getHref={(post) => `/substitutes/${post.id}`}
            linkComponent={Link}
            renderAction={(post) => (
              <BookmarkButton
                substitutePostId={post.id}
                initialBookmarked={bookmarkedIds.has(post.id)}
                variant="icon"
              />
            )}
          />
          {data && data.items.length > 0 ? (
            <div className="mt-4">
              {loadingMore ? (
                <div
                  className="space-y-3"
                  aria-busy="true"
                  aria-label="대강 더 불러오는 중"
                >
                  <SkeletonCard index={0} />
                  <SkeletonCard index={1} />
                </div>
              ) : null}
              {loadMoreError ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <p className="text-sm text-muted-foreground">
                    공고를 더 불러오지 못했어요
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      loadMoreErrorRef.current = false;
                      setLoadMoreError(false);
                      void loadNextPage();
                    }}
                    className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-muted"
                  >
                    다시 불러오기
                  </button>
                </div>
              ) : null}
              {!view.hasMore &&
              !loadingMore &&
              !loadMoreError &&
              view.items.length > 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  모든 공고를 다 봤어요
                </p>
              ) : null}
              {view.hasMore && !loadMoreError ? (
                <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </SoftContentSwap>
  );
}
