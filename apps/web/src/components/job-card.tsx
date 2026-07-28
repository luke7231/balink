import Link from "next/link";
import type { JobPostSummary } from "@/types/job-post";
import { formatJobType, formatLocation, formatPay, formatPostedAt, formatTimeSlot } from "@/lib/format";

interface JobCardProps {
  job: JobPostSummary;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group block rounded-2xl border border-rose-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
          {formatJobType(job.jobType)}
        </span>
        {job.timeSlots.slice(0, 2).map((slot) => (
          <span key={slot} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">
            {formatTimeSlot(slot)}
          </span>
        ))}
      </div>

      <h2 className="text-lg font-semibold leading-snug text-zinc-900 group-hover:text-rose-700">
        {job.title}
      </h2>

      <p className="mt-2 text-sm text-zinc-600">{formatLocation(job.sido, job.sigungu, job.locationText)}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-zinc-500">
          {job.days.length ? job.days.join(" · ") : "요일 미상"} · {formatPostedAt(job.postedAt)}
        </span>
        <span className="font-medium text-zinc-900">
          {formatPay(job.payText, job.payMinManwon, job.payMaxManwon)}
        </span>
      </div>
    </Link>
  );
}
