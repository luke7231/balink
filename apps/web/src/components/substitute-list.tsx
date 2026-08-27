import type { ReactNode } from "react";
import Link from "next/link";
import {
  formatLocation,
  formatPostedAt,
  formatSubstituteStatus,
  formatSubstituteUrgency,
  resolveSubstituteUrgency,
} from "@balink/domain";
import { Badge } from "@balink/ui/badge";
import { MapPinIcon } from "@balink/ui";
import {
  resolveSubstituteSchedule,
  SubstituteScheduleView,
} from "@/components/substitute-schedule";
import { EmptyStatePanel } from "@/components/empty-state-panel";
import { motionIndexStyle } from "@/lib/motion";
import { emptyCopy } from "@/lib/ui-copy";

export interface SubstituteCardData {
  id: string;
  title: string;
  summary?: string | null;
  author?: string | null;
  postedAt?: string | null;
  scheduleKind?: string | null;
  sessions?: Array<{
    date?: string | null;
    day?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    origin?: string | null;
  }>;
  recurrence?: {
    startDate?: string | null;
    endDate?: string | null;
    daysOfWeek?: string[];
    startTime?: string | null;
    endTime?: string | null;
    evidence?: string | null;
  } | null;
  lessonDates: string[];
  timeSlots: Array<{
    start?: string | null;
    end?: string | null;
    raw?: string | null;
  }>;
  locationText?: string | null;
  sido?: string | null;
  sigungu?: string | null;
  dongOrStation?: string | null;
  payText?: string | null;
  representativePayText?: string | null;
  academyName?: string | null;
  urgency?: string | null;
  status: string;
  nextLessonAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface SubstituteListProps {
  posts: SubstituteCardData[];
  getHref: (post: SubstituteCardData) => string;
  linkComponent?: typeof Link;
  renderAction?: (post: SubstituteCardData) => ReactNode;
}

export function SubstituteList({
  posts,
  getHref,
  linkComponent: LinkComponent = Link,
  renderAction,
}: SubstituteListProps) {
  if (posts.length === 0) {
    return (
      <EmptyStatePanel
        variant="dashed"
        title={emptyCopy.substitutes.title}
        description={emptyCopy.substitutes.description}
      />
    );
  }

  return (
    <div className="grid gap-4">
      {posts.map((post, index) => {
        const urgencyLabel = formatSubstituteUrgency(
          resolveSubstituteUrgency({
            sessions: post.sessions,
            nextLessonAt: post.nextLessonAt,
          }),
        );
        const schedule = resolveSubstituteSchedule(post);
        const hasNormalizedLocation = Boolean(
          post.sido || post.sigungu || post.dongOrStation,
        );
        const locationLabel = hasNormalizedLocation
          ? formatLocation(
              post.sido ?? null,
              post.sigungu ?? null,
              post.dongOrStation ?? null,
            )
          : post.locationText || "지역 미상";
        const payLabel =
          post.representativePayText || post.payText || "급여 협의";
        const action = renderAction?.(post);

        return (
          <div
            key={post.id}
            className="relative min-w-0 max-w-full"
            style={motionIndexStyle(index)}
          >
            <LinkComponent
              href={getHref(post)}
              className={`motion-fade-up group block min-w-0 max-w-full rounded-3xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent-border hover:shadow-md sm:p-5 ${
                action ? "pr-14 sm:pr-16" : ""
              }`}
            >
              <div className="flex flex-wrap gap-2">
                {urgencyLabel ? (
                  <Badge variant="rose">{urgencyLabel}</Badge>
                ) : null}
                <Badge>{formatSubstituteStatus(post.status)}</Badge>
              </div>

              <h2 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-accent sm:text-lg">
                {post.title}
              </h2>

              <div className="mt-3 grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-3">
                <div className="min-w-0 text-sm text-muted-foreground">
                  <div className="grid grid-cols-[14px_minmax(0,1fr)] items-start gap-x-1.5">
                    <MapPinIcon className="mt-0.5 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate">{locationLabel}</p>
                      {post.academyName ? (
                        <p className="mt-1 truncate text-muted-foreground">
                          {post.academyName}
                        </p>
                      ) : null}
                      <strong className="mt-1 block break-keep text-sm font-bold text-accent sm:text-base">
                        {payLabel}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 self-end">
                  <div className="ml-auto">
                    <SubstituteScheduleView schedule={schedule} />
                  </div>
                  <p className="mt-2 text-right text-xs text-muted-foreground">
                    {formatPostedAt(post.postedAt ?? null)}
                  </p>
                </div>
              </div>
            </LinkComponent>
            {action ? (
              <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
                {action}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
