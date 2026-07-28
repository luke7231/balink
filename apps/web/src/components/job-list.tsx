import type { JobPostSummary } from "@/types/job-post";
import { JobCard } from "./job-card";

interface JobListProps {
  jobs: JobPostSummary[];
}

export function JobList({ jobs }: JobListProps) {
  if (!jobs.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center text-zinc-500">
        아직 등록된 공고가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
