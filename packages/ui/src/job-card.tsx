import type { ReactNode } from "react";
import {
  displayableTimeSlots,
  formatDayGroups,
  formatJobType,
  formatLocation,
  formatPay,
  formatPostedAt,
  formatTimeSlot,
} from "@black-swan/domain";
import { Badge } from "./badge";
import { CalendarIcon, MapPinIcon } from "./icons";

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
  dayGroups?: string[][];
  timeSlots: string[];
  payText?: string | null;
  payMinManwon?: number | null;
  payMaxManwon?: number | null;
  representativePayText?: string | null;
  academyThumbnailUrl?: string | null;
  academyThumbnailType?: string | null;
}

interface JobCardProps {
  job: JobCardData;
  href: string;
  linkComponent?: React.ComponentType<{ href: string; className?: string; children: ReactNode }>;
  action?: ReactNode;
}

export function JobCard({ job, href, linkComponent: Link = DefaultLink, action }: JobCardProps) {
  const payLabel = formatPay(
    job.payText ?? null,
    job.payMinManwon ?? null,
    job.payMaxManwon ?? null,
    job.representativePayText ?? null,
  );
  const locationLabel = formatLocation(job.sido ?? null, job.sigungu ?? null, job.dongOrStation ?? null);
  const dayLabel = formatDayGroups(job.dayGroups, job.days);
  const slotBadges = displayableTimeSlots(job.timeSlots);

  return (
    <div className="group relative min-w-0 max-w-full rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md">
      <Link
        href={href}
        className={`block min-w-0 max-w-full p-4 sm:p-5 ${action ? "pr-14 sm:pr-16" : ""}`}
      >
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div
            className="shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-rose-100 via-rose-50 to-zinc-100"
            style={{ width: 80, height: 80 }}
          >
            {job.academyThumbnailUrl ? (
              <img
                src={job.academyThumbnailUrl}
                alt=""
                width={80}
                height={80}
                className={
                  job.academyThumbnailType === "interior"
                    ? "block object-cover transition duration-300 group-hover:scale-105"
                    : "block object-contain p-1.5"
                }
                style={{ width: 80, height: 80 }}
              />
            ) : (
              <div className="flex items-center justify-center" style={{ width: 80, height: 80 }}>
                <span className="text-xl font-bold text-rose-300" aria-hidden="true">
                  B
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge variant="rose">{formatJobType(job.jobType ?? null)}</Badge>
              {slotBadges.map((slot) => (
                <Badge key={slot}>{formatTimeSlot(slot)}</Badge>
              ))}
            </div>

            <h2 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-zinc-900 group-hover:text-rose-700 sm:text-lg">
              {job.title}
            </h2>

            <div className="mt-3 space-y-1.5 text-sm text-zinc-600">
              <p className="flex min-w-0 items-center gap-1.5">
                <MapPinIcon className="text-zinc-400" />
                <span className="truncate">{locationLabel}</span>
              </p>
              <p className="flex min-w-0 items-center gap-1.5">
                <CalendarIcon className="text-zinc-400" />
                <span className="truncate">{dayLabel}</span>
              </p>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
              <strong className="break-keep text-sm font-bold text-rose-700 sm:text-base">{payLabel}</strong>
              <p className="shrink-0 text-right text-xs text-zinc-400">{formatPostedAt(job.postedAt ?? null)}</p>
            </div>
          </div>
        </div>
      </Link>

      {action ? (
        <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">{action}</div>
      ) : null}
    </div>
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
