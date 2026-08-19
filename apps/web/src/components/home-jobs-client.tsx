"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { JobList } from "@balink/ui/job-list";
import { BookmarkButton } from "@/components/bookmark-button";
import { HomeJobsSectionFallback } from "@/components/home-fallbacks";
import { ListSortControl } from "@/components/list-sort-control";
import { MotionReveal } from "@/components/motion-reveal";
import {
  JobPostsDocument,
  type JobPostFilterInput,
  type JobPostsQuery,
} from "@/generated/graphql";
import { setFilterUrl } from "@/lib/filter-url";
import { browserGraphqlRequest } from "@/lib/graphql/browser-client";
import { buildJobsFilterHref } from "@/lib/job-filter-params";
import { readListCache, writeListCache } from "@/lib/list-cache";
import {
  JOB_SORT_OPTIONS,
  toJobPostSortEnum,
  type JobSort,
} from "@/lib/list-sort";

type JobItem = JobPostsQuery["jobPosts"]["items"][number];

type CachedJobs = {
  items: JobItem[];
  total: number;
};

function cacheKey(filter: JobPostFilterInput | null, sort: JobSort): string {
  return `job-posts:${filter?.sido ?? ""}:${filter?.sigungu ?? ""}:${sort}`;
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
  const [data, setData] = useState<CachedJobs | null>(null);

  useEffect(() => {
    const cached = readListCache<CachedJobs>(key);
    if (cached) setData(cached);
    let cancelled = false;
    const requestFilter = sido || sigungu ? { ...(sido ? { sido } : {}), ...(sigungu ? { sigungu } : {}) } : null;
    void (async () => {
      try {
        const result = await browserGraphqlRequest<JobPostsQuery>(JobPostsDocument, {
          pagination: { page: 1, limit: 40 },
          filter: requestFilter,
          sort: toJobPostSortEnum(sort),
        });
        if (cancelled) return;
        const next = {
          items: result.jobPosts.items,
          total: result.jobPosts.pageInfo.total,
        };
        writeListCache(key, next);
        startTransition(() => {
          setData(next);
        });
      } catch {
        // keep cached
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, sido, sigungu, sort]);

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
              setFilterUrl(buildJobsFilterHref(selectedSidos, selectedSigungus, nextSort));
            }}
          />
          <p className="motion-fade-in text-sm text-muted-foreground" style={{ ["--motion-index" as string]: 0 }}>
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
          <BookmarkButton jobPostId={job.id} initialBookmarked={false} variant="icon" />
        )}
      />
    </MotionReveal>
  );
}
