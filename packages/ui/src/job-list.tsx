import type { CSSProperties, ReactNode } from "react";
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
    <div className="grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)] gap-4">
      {jobs.map((job, index) => (
        <div
          key={job.id}
          className="motion-fade-up min-w-0 max-w-full"
          style={{ ["--motion-index" as string]: Math.min(index, 10) } as CSSProperties}
        >
          <JobCard
            job={job}
            href={getHref(job)}
            linkComponent={linkComponent}
            action={renderAction?.(job)}
          />
        </div>
      ))}
    </div>
  );
}

export type { JobCardData };
