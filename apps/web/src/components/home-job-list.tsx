import Link from "next/link";
import { JobList } from "@balink/ui/job-list";
import { auth } from "@/auth";
import { BookmarkButton } from "@/components/bookmark-button";
import { getBookmarkedJobIdSet } from "@/lib/job-bookmarks";
import type { JobPostsQuery } from "@/generated/graphql";

type JobItem = JobPostsQuery["jobPosts"]["items"][number];

export function HomeJobListFallback({ jobs }: { jobs: JobItem[] }) {
  return (
    <JobList
      jobs={jobs}
      getHref={(job) => `/jobs/${job.id}`}
      linkComponent={Link}
      renderAction={(job) => (
        <BookmarkButton jobPostId={job.id} initialBookmarked={false} variant="icon" />
      )}
    />
  );
}

export async function HomeJobList({ jobs }: { jobs: JobItem[] }) {
  const session = await auth();
  const bookmarkedIds = await getBookmarkedJobIdSet(
    session?.user?.id,
    jobs.map((job) => job.id),
  );

  return (
    <JobList
      jobs={jobs}
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
  );
}
