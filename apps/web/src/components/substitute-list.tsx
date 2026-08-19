import Link from "next/link";
import {
  formatLessonDates,
  formatLocation,
  formatPostedAt,
  formatRecurrenceSummary,
  listSubstituteSessionCardGroups,
  type SubstituteSessionDateGroup,
  formatSubstituteStatus,
  formatSubstituteUrgency,
  resolveSubstituteUrgency,
} from "@balink/domain";
import { Badge } from "@balink/ui/badge";
import { CalendarIcon, MapPinIcon } from "@balink/ui";
import { motionIndexStyle } from "@/lib/motion";

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
}

type ScheduleBlock =
  | { kind: "groups"; groups: SubstituteSessionDateGroup[]; overflow: number }
  | { kind: "lines"; lines: string[] };

function resolveCardSchedule(post: SubstituteCardData): ScheduleBlock {
  if (post.scheduleKind === "recurring") {
    const summary = formatRecurrenceSummary(post.recurrence ?? null);
    return { kind: "lines", lines: summary ? [summary] : ["반복 일정"] };
  }

  if (post.scheduleKind === "unscheduled" || post.lessonDates.length === 0) {
    return { kind: "lines", lines: ["일정 협의"] };
  }

  const { groups, overflow } = listSubstituteSessionCardGroups(
    post.sessions ?? [],
  );
  if (groups.length > 0) {
    return { kind: "groups", groups, overflow };
  }

  const fallback = formatLessonDates(post.lessonDates);
  return {
    kind: "lines",
    lines: fallback ? fallback.split(" · ") : ["일정 협의"],
  };
}

export function SubstituteList({
  posts,
  getHref,
  linkComponent: LinkComponent = Link,
}: SubstituteListProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-surface px-6 py-16 text-center text-sm text-muted-foreground">
        표시할 대강 글이 없습니다.
      </div>
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
        const schedule = resolveCardSchedule(post);
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

        return (
          <LinkComponent
            key={post.id}
            href={getHref(post)}
            style={motionIndexStyle(index)}
            className="motion-fade-up group block min-w-0 max-w-full rounded-3xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent-border hover:shadow-md sm:p-5"
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
                <div className="ml-auto inline-grid grid-cols-[14px_minmax(0,auto)] gap-x-1.5 gap-y-1 text-left text-sm leading-snug text-foreground">
                  {schedule.kind === "groups" ? (
                    <>
                      {schedule.groups.map((group, groupIndex) => (
                        <div key={group.date} className="contents">
                          {groupIndex === 0 ? (
                            <CalendarIcon className="mt-0.5 text-muted-foreground" />
                          ) : (
                            <span aria-hidden="true" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium">{group.dateLabel}</p>
                            {group.times.length > 0 ? (
                              <ul className="mt-0.5 space-y-0.5 pl-2 text-muted-foreground">
                                {group.times.map((time) => (
                                  <li key={`${group.date}-${time}`}>
                                    · {time}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </div>
                      ))}
                      {schedule.overflow > 0 ? (
                        <>
                          <span aria-hidden="true" />
                          <p className="text-muted-foreground">
                            외 {schedule.overflow}개
                          </p>
                        </>
                      ) : null}
                    </>
                  ) : (
                    schedule.lines.map((line, index) => (
                      <div key={`${line}-${index}`} className="contents">
                        {index === 0 ? (
                          <CalendarIcon className="mt-0.5 text-muted-foreground" />
                        ) : (
                          <span aria-hidden="true" />
                        )}
                        <span className="wrap-break-word font-medium">
                          {line}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <p className="mt-2 text-right text-xs text-muted-foreground">
                  {formatPostedAt(post.postedAt ?? null)}
                </p>
              </div>
            </div>
          </LinkComponent>
        );
      })}
    </div>
  );
}
