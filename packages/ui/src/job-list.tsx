import type { CSSProperties, ReactNode } from "react";
import { EmptyState } from "./empty-state";
import { JobCard, type JobCardData, type JobListViewVariant } from "./job-card";

interface JobListProps {
  jobs: JobCardData[];
  getHref: (job: JobCardData) => string;
  linkComponent?: React.ComponentType<{ href: string; className?: string; children: ReactNode }>;
  renderAction?: (job: JobCardData) => ReactNode;
  variant?: JobListViewVariant;
}

export function JobList({
  jobs,
  getHref,
  linkComponent,
  renderAction,
  variant = "card",
}: JobListProps) {
  if (!jobs.length) {
    return (
      <EmptyState
        message="아직 등록된 채용 공고가 없어요"
        description="새 공고가 올라오면 여기에 바로 보여 드릴게요."
      />
    );
  }

  if (variant === "board") {
    return (
      <div className="w-full min-w-0 max-w-full overflow-hidden rounded-3xl border border-border bg-surface shadow-sm divide-y divide-border">
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
              variant="board"
            />
          </div>
        ))}
      </div>
    );
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
            variant="card"
          />
        </div>
      ))}
    </div>
  );
}

export type { JobCardData, JobListViewVariant };
