import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatLessonDates,
  formatLocation,
  formatPostedAt,
  formatRecurrenceSummary,
  formatSubstituteStatus,
  formatSubstituteUrgency,
} from "@black-swan/domain";
import { Badge } from "@black-swan/ui/badge";
import { fetchSubstitutePost } from "@/lib/graphql/queries";

export const dynamic = "force-dynamic";

interface SubstituteDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatSessionLabel(session: {
  date?: string | null;
  day?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}): string {
  const date = [session.date, session.day].filter(Boolean).join(" ");
  const time =
    session.startTime && session.endTime
      ? `${session.startTime}~${session.endTime}`
      : session.startTime || session.endTime || "";
  return [date, time].filter(Boolean).join(" ");
}

export default async function SubstituteDetailPage({ params }: SubstituteDetailPageProps) {
  const { id } = await params;
  const post = await fetchSubstitutePost(id);

  if (!post) notFound();

  const urgencyLabel = formatSubstituteUrgency(post.urgency ?? null);
  const explicitSessions = post.sessions.filter((session) => session.origin !== "recurrence");
  const scheduleSummary =
    post.scheduleKind === "recurring"
      ? formatRecurrenceSummary(post.recurrence ?? null) || "반복 일정"
      : post.scheduleKind === "unscheduled" || post.lessonDates.length === 0
        ? "일정 협의"
        : formatLessonDates(post.lessonDates);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-5">
          <Link href="/substitutes" className="text-sm font-medium text-rose-600 hover:text-rose-700">
            ← 대타 게시판
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            {urgencyLabel ? <Badge variant="rose">{urgencyLabel}</Badge> : null}
            <Badge>{formatSubstituteStatus(post.status)}</Badge>
          </div>

          <h1 className="text-2xl font-bold leading-tight text-zinc-900">{post.title}</h1>
          {post.summary ? <p className="mt-3 text-sm leading-6 text-zinc-600">{post.summary}</p> : null}

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">작성자</dt>
              <dd className="mt-1 font-medium text-zinc-900">{post.author || "미상"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">게시일</dt>
              <dd className="mt-1 font-medium text-zinc-900">{formatPostedAt(post.postedAt ?? null)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">지역</dt>
              <dd className="mt-1 font-medium text-zinc-900">
                {post.locationText ||
                  formatLocation(post.sido ?? null, post.sigungu ?? null, post.dongOrStation ?? null)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">일정</dt>
              <dd className="mt-1 font-medium text-zinc-900">{scheduleSummary}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">급여</dt>
              <dd className="mt-1 font-medium text-zinc-900">
                {post.representativePayText || post.representativePay?.displayText || post.payText || "협의"}
              </dd>
            </div>
            {post.academyName ? (
              <div>
                <dt className="text-zinc-500">학원명</dt>
                <dd className="mt-1 font-medium text-zinc-900">{post.academyName}</dd>
              </div>
            ) : null}
          </dl>

          {explicitSessions.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-zinc-900">수업 세션</h2>
              <ul className="mt-3 space-y-3">
                {explicitSessions.map((session, index) => (
                  <li key={`${session.date}-${session.startTime}-${index}`} className="rounded-2xl bg-zinc-50 p-4 text-sm">
                    <div className="font-medium text-zinc-900">{formatSessionLabel(session)}</div>
                    <div className="mt-2 text-zinc-600">
                      대상: {session.audienceTypes.join(", ") || "미상"} · 장르: {session.subjectTypes.join(", ") || "미상"}
                    </div>
                    {session.pay ? (
                      <div className="mt-1 text-zinc-600">
                        급여: {session.pay.evidence || `${session.pay.minManwon ?? ""}만원`}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {post.requirements.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-zinc-900">요건</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                {post.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {post.body ? (
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-zinc-900">원문</h2>
              <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
                {post.body}
              </pre>
            </section>
          ) : null}

          {(post.contactPhones.length > 0 || post.contactEmails.length > 0) && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-zinc-900">연락처</h2>
              <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                {post.contactPhones.map((phone) => (
                  <li key={phone}>{phone}</li>
                ))}
                {post.contactEmails.map((email) => (
                  <li key={email}>{email}</li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-8">
            <a
              href={post.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
            >
              발레매니아 원문 보기
            </a>
          </div>
        </article>
      </main>
    </div>
  );
}
