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
        const timeLabel =
          post.timeSlots
            .map((slot) => slot.raw || [slot.start, slot.end].filter(Boolean).join("~"))
            .filter(Boolean)
            .join(", ") || "시간 미상";

        return (
          <LinkComponent
            key={post.id}
            href={getHref(post)}
            className="block rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-rose-200 hover:shadow-md"
          >
            <div className="mb-3 flex flex-wrap gap-2">
              {urgencyLabel ? <Badge variant="rose">{urgencyLabel}</Badge> : null}
              <Badge>{formatSubstituteStatus(post.status)}</Badge>
            </div>

            <h2 className="text-lg font-semibold leading-snug text-zinc-900">{post.title}</h2>
            {post.summary ? <p className="mt-2 text-sm text-zinc-600">{post.summary}</p> : null}

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">지역</dt>
                <dd className="mt-1 font-medium text-zinc-900">
                  {post.locationText ||
                    formatLocation(post.sido ?? null, post.sigungu ?? null, post.dongOrStation ?? null)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">다음 수업</dt>
                <dd className="mt-1 font-medium text-zinc-900">{formatNextSession(post)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">시간</dt>
                <dd className="mt-1 font-medium text-zinc-900">{timeLabel}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">급여</dt>
                <dd className="mt-1 font-medium text-zinc-900">
                  {post.representativePayText || post.payText || "협의"}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500">
              {post.author ? <span>{post.author}</span> : null}
              <span>{formatPostedAt(post.postedAt ?? null)}</span>
              {post.academyName ? <span>{post.academyName}</span> : null}
            </div>
          </LinkComponent>
        );
      })}
    </div>
  );
}
