import type { ReactNode } from "react";
import {
  formatJobType,
  formatLocation,
  formatPay,
  formatPostedAt,
  formatTimeSlot,
} from "@black-swan/domain";
import { Badge } from "./badge";

export interface JobCardData {
  id: string;
  title: string;
  jobType?: string | null;
  postedAt?: string | Date | null;
  locationText?: string | null;
  sido?: string | null;
  sigungu?: string | null;
  dongOrStation?: string | null;
  days: string[];
  timeSlots: string[];
  payText?: string | null;
  payMinManwon?: number | null;
  payMaxManwon?: number | null;
  representativePayText?: string | null;
}

interface JobCardProps {
  job: JobCardData;
  href: string;
  linkComponent?: React.ComponentType<{ href: string; className?: string; children: ReactNode }>;
}

export function JobCard({ job, href, linkComponent: Link = DefaultLink }: JobCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-rose-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant="rose">{formatJobType(job.jobType ?? null)}</Badge>
        {job.timeSlots.slice(0, 2).map((slot) => (
          <Badge key={slot}>{formatTimeSlot(slot)}</Badge>
        ))}
      </div>

      <h2 className="text-lg font-semibold leading-snug text-zinc-900 group-hover:text-rose-700">{job.title}</h2>

      <p className="mt-2 text-sm text-zinc-600">
        {formatLocation(job.sido ?? null, job.sigungu ?? null, job.dongOrStation ?? null)}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-zinc-500">
          {job.days.length ? job.days.join(" · ") : "요일 미상"} · {formatPostedAt(job.postedAt ?? null)}
        </span>
        <span className="font-medium text-zinc-900">
          {formatPay(
            job.payText ?? null,
            job.payMinManwon ?? null,
            job.payMaxManwon ?? null,
            job.representativePayText ?? null,
          )}
        </span>
      </div>
    </Link>
  );
}

function DefaultLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
