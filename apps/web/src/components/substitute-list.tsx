import Link from "next/link";
import {
  formatLessonDates,
  formatLocation,
  formatPostedAt,
  formatRecurrenceSummary,
  formatSubstituteStatus,
  formatSubstituteUrgency,
} from "@black-swan/domain";
import { Badge } from "@black-swan/ui/badge";

export interface SubstituteCardData {
  id: string;
  title: string;
  summary?: string | null;
  author?: string | null;
  postedAt?: string | null;
  scheduleKind?: string | null;
  sessions?: Array<{
    date?: string | null;
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
  timeSlots: Array<{ start?: string | null; end?: string | null; raw?: string | null }>;
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
}

interface SubstituteListProps {
  posts: SubstituteCardData[];
  getHref: (post: SubstituteCardData) => string;
  linkComponent?: typeof Link;
}

function formatNextSession(post: SubstituteCardData): string {
  if (post.scheduleKind === "recurring") {
    return formatRecurrenceSummary(post.recurrence ?? null) || "반복 일정";
  }

  if (post.scheduleKind === "unscheduled" || post.lessonDates.length === 0) {
    return "일정 협의";
  }

  const explicitSession = post.sessions?.find((session) => session.origin !== "recurrence" && session.date);
  if (explicitSession?.date) {
    const time =
      explicitSession.startTime && explicitSession.endTime
        ? `${explicitSession.startTime}~${explicitSession.endTime}`
        : explicitSession.startTime || "";
    return [explicitSession.date, time].filter(Boolean).join(" ");
  }

  return formatLessonDates(post.lessonDates);
}

export function SubstituteList({ posts, getHref, linkComponent: LinkComponent = Link }: SubstituteListProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center text-sm text-zinc-500">
        표시할 대타 글이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {posts.map((post) => {
        const urgencyLabel = formatSubstituteUrgency(post.urgency ?? null);
        const scheduleLabel = formatNextSession(post);
        const hasNormalizedLocation = Boolean(post.sido || post.sigungu || post.dongOrStation);
        const locationLabel = hasNormalizedLocation
          ? formatLocation(post.sido ?? null, post.sigungu ?? null, post.dongOrStation ?? null)
          : post.locationText || "지역 미상";
        const payLabel = post.representativePayText || post.payText || "급여 협의";
        const timeLabel =
          post.timeSlots
            .map((slot) => slot.raw || [slot.start, slot.end].filter(Boolean).join("~"))
            .filter(Boolean)
            .join(", ") || "시간 미상";

        return (
          <LinkComponent
            key={post.id}
            href={getHref(post)}
            className="group block overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
          >
            <div className="border-b border-rose-100 bg-rose-50/70 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {urgencyLabel ? <Badge variant="rose">{urgencyLabel}</Badge> : null}
                    <Badge>{formatSubstituteStatus(post.status)}</Badge>
                  </div>
                  <p className="text-lg font-bold tracking-tight text-zinc-950">{scheduleLabel}</p>
                  {timeLabel !== "시간 미상" && !scheduleLabel.includes(timeLabel) ? (
                    <p className="mt-1 text-sm text-zinc-600">{timeLabel}</p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-rose-700 shadow-sm">
                  {payLabel}
                </span>
              </div>
            </div>

            <div className="p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <span aria-hidden="true">📍</span>
                {locationLabel}
              </p>

              <h2 className="mt-4 text-base font-semibold leading-snug text-zinc-900 group-hover:text-rose-700">
                {post.title}
              </h2>

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                {post.academyName ? <span>{post.academyName}</span> : null}
                <span>{formatPostedAt(post.postedAt ?? null)}</span>
              </div>
            </div>
          </LinkComponent>
        );
      })}
    </div>
  );
}
