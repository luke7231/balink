"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { JobList } from "@balink/ui/job-list";
import { BookmarkButton } from "@/components/bookmark-button";
import { HomeJobsSectionFallback } from "@/components/home-fallbacks";
import { MotionReveal } from "@/components/motion-reveal";
import {
  JobPostsDocument,
  type JobPostFilterInput,
  type JobPostsQuery,
} from "@/generated/graphql";
import { browserGraphqlRequest } from "@/lib/graphql/browser-client";
import { readListCache, writeListCache } from "@/lib/list-cache";

type JobItem = JobPostsQuery["jobPosts"]["items"][number];

type CachedJobs = {
  items: JobItem[];
  total: number;
};

function cacheKey(filter: JobPostFilterInput | null): string {
  return `job-posts:${filter?.sido ?? ""}:${filter?.sigungu ?? ""}`;
}

export function HomeJobsClient({
  filter,
  hasFilter,
}: {
  filter: JobPostFilterInput | null;
  hasFilter: boolean;
}) {
  const key = useMemo(() => cacheKey(filter), [filter]);
  const [data, setData] = useState<CachedJobs | null>(null);

  useEffect(() => {
    setData(readListCache<CachedJobs>(key));
    let cancelled = false;
    void (async () => {
      try {
        const result = await browserGraphqlRequest<JobPostsQuery>(JobPostsDocument, {
          pagination: { page: 1, limit: 40 },
          filter,
        });
        if (cancelled) return;
        const next = {
          items: result.jobPosts.items,
          total: result.jobPosts.pageInfo.total,
        };
        setData(next);
        writeListCache(key, next);
      } catch {
        // keep cached
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter, key]);

  if (!data) {
    return (
      <MotionReveal index={3} variant="fade-in" remountKey={`jobs-loading-${key}`}>
        <HomeJobsSectionFallback hasFilter={hasFilter} />
      </MotionReveal>
    );
  }

  return (
    <MotionReveal index={3} variant="soft-scale" remountKey={`jobs-ready-${key}-${data.total}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">최신 공고</h3>
        <p className="motion-fade-in text-sm text-muted-foreground" style={{ ["--motion-index" as string]: 0 }}>
          {data.total}건
          {hasFilter ? " · 필터 적용" : ""}
        </p>
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
