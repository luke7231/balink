import type { ReactNode } from "react";
import { EmptyState } from "./empty-state";
import { JobCard, type JobCardData } from "./job-card";

interface JobListProps {
  jobs: JobCardData[];
  getHref: (job: JobCardData) => string;
  linkComponent?: React.ComponentType<{ href: string; className?: string; children: ReactNode }>;
  renderAction?: (job: JobCardData) => ReactNode;
}

export function JobList({ jobs, getHref, linkComponent, renderAction }: JobListProps) {
  if (!jobs.length) {
    return <EmptyState message="아직 등록된 공고가 없습니다." />;
  }

  return (
    <div className="grid min-w-0 gap-4">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          href={getHref(job)}
          linkComponent={linkComponent}
          action={renderAction?.(job)}
        />
      ))}
    </div>
  );
}

export type { JobCardData };
