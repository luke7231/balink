import type { ReactNode } from "react";
import {
  displayableTimeSlots,
  formatDayGroups,
  formatJobType,
  formatLocation,
  formatPay,
  formatPostedAt,
  formatTimeSlot,
} from "@balink/domain";
import { Badge } from "./badge";
import { CalendarIcon, MapPinIcon } from "./icons";

export type JobListViewVariant = "card" | "board";

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
  variant?: JobListViewVariant;
}

function splitPayLabel(payLabel: string): { amount: string; unit: string | null } | null {
  const match = payLabel.match(/^(.+?)(만원)$/);
  if (!match) return null;
  return { amount: match[1], unit: match[2] };
}

export function JobCard({
  job,
  href,
  linkComponent: Link = DefaultLink,
  action,
  variant = "card",
}: JobCardProps) {
  const payLabel = formatPay(
    job.payText ?? null,
    job.payMinManwon ?? null,
    job.payMaxManwon ?? null,
    job.representativePayText ?? null,
  );
  const locationLabel = formatLocation(job.sido ?? null, job.sigungu ?? null, job.dongOrStation ?? null);
  const dayLabel = formatDayGroups(job.dayGroups, job.days);
  const slotBadges = displayableTimeSlots(job.timeSlots);
  const postedLabel = formatPostedAt(job.postedAt ?? null);

  if (variant === "board") {
    const metaParts = [locationLabel, dayLabel].filter(Boolean);
    const payParts = splitPayLabel(payLabel);

    return (
      <div className="group relative box-border min-w-0 w-full max-w-full">
        <Link
          href={href}
          className={`flex min-w-0 max-w-full items-start gap-2.5 px-3 py-2.5 transition hover:bg-surface-muted ${
            action ? "pr-11" : ""
          }`}
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-accent-subtle via-accent-subtle/70 to-surface-muted ${
              job.academyThumbnailType === "logo" || !job.academyThumbnailUrl ? "p-1" : ""
            }`}
          >
            {job.academyThumbnailUrl ? (
              <img
                src={job.academyThumbnailUrl}
                alt=""
                className={
                  job.academyThumbnailType === "interior"
                    ? "h-full w-full object-cover"
                    : "max-h-full max-w-full rounded-md object-contain"
                }
              />
            ) : (
              <span className="text-sm font-bold text-accent/35" aria-hidden="true">
                B
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold leading-snug text-foreground">
              {job.title}
            </h2>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {metaParts.join(" · ")}
            </p>
            <div className="mt-0.5 flex items-baseline justify-between gap-2">
              {payParts ? (
                <span className="inline-flex min-w-0 items-baseline gap-0.5">
                  <strong className="tabular-nums text-sm font-bold text-foreground">
                    {payParts.amount}
                  </strong>
                  <span className="text-[0.65rem] font-medium text-muted-foreground">
                    {payParts.unit}
                  </span>
                </span>
              ) : (
                <strong className="min-w-0 truncate break-keep text-sm font-bold text-foreground">
                  {payLabel}
                </strong>
              )}
              <p className="shrink-0 text-xs text-muted-foreground">{postedLabel}</p>
            </div>
          </div>
        </Link>

        {action ? (
          <div className="absolute right-1.5 top-1.5 z-10">{action}</div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="group relative box-border min-w-0 w-full max-w-full rounded-3xl border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:border-accent-border hover:shadow-md">
      <Link
        href={href}
        className={`block min-w-0 max-w-full p-4 sm:p-5 ${action ? "pr-14 sm:pr-16" : ""}`}
      >
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div
            className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-accent-subtle via-accent-subtle/70 to-surface-muted ${
              job.academyThumbnailType === "logo" || !job.academyThumbnailUrl ? "p-1.5" : ""
            }`}
          >
            {job.academyThumbnailUrl ? (
              <img
                src={job.academyThumbnailUrl}
                alt=""
                className={
                  job.academyThumbnailType === "interior"
                    ? "h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    : "max-h-full max-w-full rounded-lg object-contain"
                }
              />
            ) : (
              <span className="text-xl font-bold text-accent/35" aria-hidden="true">
                B
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge variant="rose">{formatJobType(job.jobType ?? null)}</Badge>
              {slotBadges.map((slot) => (
                <Badge key={slot}>{formatTimeSlot(slot)}</Badge>
              ))}
            </div>

            <h2 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-accent sm:text-lg">
              {job.title}
            </h2>

            <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <p className="flex min-w-0 items-center gap-1.5">
                <MapPinIcon className="text-muted-foreground" />
                <span className="truncate">{locationLabel}</span>
              </p>
              <p className="flex min-w-0 items-center gap-1.5">
                <CalendarIcon className="text-muted-foreground" />
                <span className="truncate">{dayLabel}</span>
              </p>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
              <strong className="break-keep text-sm font-bold text-accent sm:text-base">{payLabel}</strong>
              <p className="shrink-0 text-right text-xs text-muted-foreground">{postedLabel}</p>
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
