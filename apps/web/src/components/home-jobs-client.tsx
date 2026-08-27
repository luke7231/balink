"use client";

import Link from "next/link";
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { JobList } from "@balink/ui/job-list";
import { getBookmarkedJobIdsAction } from "@/components/bookmark-actions";
import { BookmarkButton } from "@/components/bookmark-button";
import { HomeJobsSectionFallback } from "@/components/home-fallbacks";
import { ListSortControl } from "@/components/list-sort-control";
import { MotionReveal } from "@/components/motion-reveal";
import { SkeletonCard } from "@/components/skeleton-block";
import {
  JobPostsDocument,
  type JobPostFilterInput,
  type JobPostsQuery,
} from "@/generated/graphql";
import { setFilterUrl } from "@/lib/filter-url";
import { browserGraphqlRequest } from "@/lib/graphql/browser-client";
import { buildJobsFilterHref } from "@/lib/job-filter-params";
import { errorCopy, listEndCopy } from "@/lib/ui-copy";
import { readListCache, writeListCache } from "@/lib/list-cache";
import {
  JOB_SORT_OPTIONS,
  toJobPostSortEnum,
  type JobSort,
} from "@/lib/list-sort";

const PAGE_SIZE = 20;

type JobItem = JobPostsQuery["jobPosts"]["items"][number];

type CachedJobs = {
  items: JobItem[];
  total: number;
};

type JobsState = {
  items: JobItem[];
  page: number;
  total: number;
  hasMore: boolean;
};

function cacheKey(filter: JobPostFilterInput | null, sort: JobSort): string {
  return `job-posts:${filter?.sido ?? ""}:${filter?.sigungu ?? ""}:${sort}:${PAGE_SIZE}`;
}

function buildRequestFilter(
  sido: string,
  sigungu: string,
): JobPostFilterInput | null {
  return sido || sigungu
    ? { ...(sido ? { sido } : {}), ...(sigungu ? { sigungu } : {}) }
    : null;
}

function appendUnique(existing: JobItem[], incoming: JobItem[]): JobItem[] {
  if (incoming.length === 0) return existing;
  const seen = new Set(existing.map((job) => job.id));
  const next = [...existing];
  for (const job of incoming) {
    if (seen.has(job.id)) continue;
    seen.add(job.id);
    next.push(job);
  }
  return next;
}

function toJobsState(
  items: JobItem[],
  page: number,
  total: number,
  totalPages: number,
): JobsState {
  return {
    items,
    page,
    total,
    hasMore: page < totalPages,
  };
}

export function HomeJobsClient({
  filter,
  hasFilter,
  selectedSidos,
  selectedSigungus,
  sort,
}: {
  filter: JobPostFilterInput | null;
  hasFilter: boolean;
  selectedSidos: string[];
  selectedSigungus: string[];
  sort: JobSort;
}) {
  const sido = filter?.sido ?? "";
  const sigungu = filter?.sigungu ?? "";
  const key = cacheKey(filter, sort);
  const [data, setData] = useState<JobsState | null>(null);
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
      const bookmarked = await getBookmarkedJobIdsAction(ids);
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
    const cached = readListCache<CachedJobs>(key);
    if (cached) {
      setData(
        toJobsState(
          cached.items,
          1,
          cached.total,
          Math.max(1, Math.ceil(cached.total / PAGE_SIZE)),
        ),
      );
      setBookmarkedIds(new Set());
      void mergeBookmarks(cached.items.map((job) => job.id));
    } else {
      setData(null);
      setBookmarkedIds(new Set());
    }
    loadingMoreRef.current = false;
    loadMoreErrorRef.current = false;
    setLoadingMore(false);
    setLoadMoreError(false);

    let cancelled = false;
    const requestFilter = buildRequestFilter(sido, sigungu);
    void (async () => {
      try {
        const result = await browserGraphqlRequest<JobPostsQuery>(
          JobPostsDocument,
          {
            pagination: { page: 1, limit: PAGE_SIZE },
            filter: requestFilter,
            sort: toJobPostSortEnum(sort),
          },
        );
        if (cancelled) return;
        const { items, pageInfo } = result.jobPosts;
        const next = toJobsState(
          items,
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
        void mergeBookmarks(items.map((job) => job.id));
      } catch {
        // keep cached
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, sido, sigungu, sort, mergeBookmarks]);

  const loadNextPage = useCallback(async () => {
    const current = dataRef.current;
    if (!current?.hasMore || loadingMoreRef.current || loadMoreErrorRef.current)
      return;

    const requestKey = key;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = current.page + 1;

    try {
      const result = await browserGraphqlRequest<JobPostsQuery>(
        JobPostsDocument,
        {
          pagination: { page: nextPage, limit: PAGE_SIZE },
          filter: buildRequestFilter(sido, sigungu),
          sort: toJobPostSortEnum(sort),
        },
      );
      if (requestKey !== keyRef.current) return;
      const { items, pageInfo } = result.jobPosts;
      const existingIds = new Set(current.items.map((job) => job.id));
      const merged = appendUnique(current.items, items);
      const next = toJobsState(
        merged,
        pageInfo.page,
        pageInfo.total,
        pageInfo.totalPages,
      );
      setData(next);
      const newIds = items
        .map((job) => job.id)
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
  }, [key, mergeBookmarks, sido, sigungu, sort]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !data?.hasMore || loadMoreError) return;

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
  }, [data?.hasMore, loadMoreError, loadNextPage]);

  if (!data) {
    return (
      <MotionReveal index={3} variant="fade-in">
        <HomeJobsSectionFallback hasFilter={hasFilter} />
      </MotionReveal>
    );
  }

  return (
    <MotionReveal index={3} variant="soft-scale">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">채용 공고</h3>
        <div className="flex shrink-0 items-center gap-2">
          <ListSortControl
            value={sort}
            options={JOB_SORT_OPTIONS}
            sheetTitle="정렬"
            ariaLabel="채용 공고 정렬"
            onChange={(nextSort) => {
              setFilterUrl(
                buildJobsFilterHref(selectedSidos, selectedSigungus, nextSort),
              );
            }}
          />
          <p
            className="motion-fade-in text-sm text-muted-foreground"
            style={{ ["--motion-index" as string]: 0 }}
          >
            {data.total}건
            {hasFilter ? " · 필터 적용" : ""}
          </p>
        </div>
      </div>
      <JobList
        jobs={data.items}
        getHref={(job) => `/jobs/${job.id}`}
        linkComponent={Link}
        renderAction={(job) => (
          <BookmarkButton
            jobPostId={job.id}
            initialBookmarked={bookmarkedIds.has(job.id)}
            variant="icon"
          />
        )}
      />
      {data.items.length > 0 ? (
        <div className="mt-4">
          {loadingMore ? (
            <div
              className="space-y-3"
              aria-busy="true"
              aria-label="공고 더 불러오는 중"
            >
              <SkeletonCard index={0} />
              <SkeletonCard index={1} />
            </div>
          ) : null}
          {loadMoreError ? (
            <div className="flex flex-col items-center gap-2 py-4" role="alert">
              <p className="text-sm text-muted-foreground">
                {errorCopy.loadMoreJobs}
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
                {errorCopy.reload}
              </button>
            </div>
          ) : null}
          {!data.hasMore && !loadingMore && !loadMoreError ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {listEndCopy.allJobs}
            </p>
          ) : null}
          {data.hasMore && !loadMoreError ? (
            <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
          ) : null}
        </div>
      ) : null}
    </MotionReveal>
  );
}
