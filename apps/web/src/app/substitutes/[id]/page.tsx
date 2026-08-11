import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatLessonDates,
  formatLocation,
  formatPostedAt,
  formatRecurrenceSummary,
  formatSubstituteSessionLabel,
  formatSubstituteSessionsCardLabel,
  formatSubstituteStatus,
  formatSubstituteUrgency,
  resolveSubstituteUrgency,
} from "@balink/domain";
import { Badge } from "@balink/ui/badge";
import { fetchSubstitutePost } from "@/lib/graphql/queries";

export const dynamic = "force-dynamic";

interface SubstituteDetailPageProps {
  params: Promise<{ id: string }>;
}

function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export default async function SubstituteDetailPage({ params }: SubstituteDetailPageProps) {
  const { id } = await params;
  const post = await fetchSubstitutePost(id);

  if (!post) notFound();

  const urgencyLabel = formatSubstituteUrgency(
    resolveSubstituteUrgency({
      sessions: post.sessions,
      nextLessonAt: post.nextLessonAt,
    }),
  );
  const explicitSessions = post.sessions.filter((session) => session.origin !== "recurrence");
  const scheduleSummary =
    post.scheduleKind === "recurring"
      ? formatRecurrenceSummary(post.recurrence ?? null) || "반복 일정"
      : post.scheduleKind === "unscheduled" || post.lessonDates.length === 0
        ? "일정 협의"
        : formatSubstituteSessionsCardLabel(explicitSessions) ||
          formatLessonDates(post.lessonDates);
  const hasNormalizedLocation = Boolean(post.sido || post.sigungu || post.dongOrStation);
  const locationLabel = hasNormalizedLocation
    ? formatLocation(post.sido ?? null, post.sigungu ?? null, post.dongOrStation ?? null)
    : post.locationText || "지역 미상";
  const payLabel =
    post.representativePayText || post.representativePay?.displayText || post.payText || "급여 협의";
  const primaryPhone = post.contactPhones[0];
  const primaryEmail = post.contactEmails[0];

  return (
    <div className="min-h-full bg-surface-muted pb-24 sm:pb-0">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-5">
          <Link href="/substitutes" className="text-sm font-medium text-accent hover:text-accent">
            ← 대강 게시판
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            {urgencyLabel ? <Badge variant="rose">{urgencyLabel}</Badge> : null}
            <Badge>{formatSubstituteStatus(post.status)}</Badge>
          </div>

          <section className="mb-6 rounded-3xl border border-accent-border bg-accent-subtle/70 p-5">
            <p className="text-xl font-bold tracking-tight text-foreground">{scheduleSummary}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">지역</p>
                <p className="mt-1 font-semibold text-foreground">{locationLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground">급여</p>
                <p className="mt-1 font-bold text-accent">{payLabel}</p>
              </div>
            </div>
            <div className="mt-5 hidden flex-wrap gap-2 sm:flex">
              {primaryPhone ? (
                <a
                  href={phoneHref(primaryPhone)}
                  className="inline-flex rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  전화하기
                </a>
              ) : null}
              {primaryEmail ? (
                <a
                  href={`mailto:${primaryEmail}`}
                  className="inline-flex rounded-full border border-accent-border bg-surface px-5 py-2.5 text-sm font-semibold text-accent hover:bg-accent-subtle"
                >
                  이메일 보내기
                </a>
              ) : null}
              <a
                href={post.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted"
              >
                원문 보기
              </a>
            </div>
          </section>

          <h1 className="text-2xl font-bold leading-tight text-foreground">{post.title}</h1>
          {post.summary ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{post.summary}</p> : null}

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">작성자</dt>
              <dd className="mt-1 font-medium text-foreground">{post.author || "미상"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">게시일</dt>
              <dd className="mt-1 font-medium text-foreground">{formatPostedAt(post.postedAt ?? null)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">지역</dt>
              <dd className="mt-1 font-medium text-foreground">{locationLabel}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">일정</dt>
              <dd className="mt-1 font-medium text-foreground">{scheduleSummary}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">급여</dt>
              <dd className="mt-1 font-medium text-foreground">{payLabel}</dd>
            </div>
            {post.academyName ? (
              <div>
                <dt className="text-muted-foreground">학원명</dt>
                <dd className="mt-1 font-medium text-foreground">{post.academyName}</dd>
              </div>
            ) : null}
          </dl>

          {explicitSessions.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-foreground">수업 세션</h2>
              <ul className="mt-3 space-y-3">
                {explicitSessions.map((session, index) => (
                  <li key={`${session.date}-${session.startTime}-${index}`} className="rounded-2xl bg-surface-muted p-4 text-sm">
                    <div className="font-medium text-foreground">{formatSubstituteSessionLabel(session)}</div>
                    <div className="mt-2 text-muted-foreground">
                      대상: {session.audienceTypes.join(", ") || "미상"} · 장르: {session.subjectTypes.join(", ") || "미상"}
                    </div>
                    {session.pay ? (
                      <div className="mt-1 text-muted-foreground">
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
              <h2 className="text-sm font-semibold text-foreground">요건</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foreground">
                {post.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {post.body ? (
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-foreground">원문</h2>
              <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-surface-muted p-4 text-sm leading-6 text-foreground">
                {post.body}
              </pre>
            </section>
          ) : null}

          {(post.contactPhones.length > 0 || post.contactEmails.length > 0) && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-foreground">연락처</h2>
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                {post.contactPhones.map((phone) => (
                  <li key={phone}>
                    <a href={phoneHref(phone)} className="font-medium text-accent hover:underline">
                      {phone}
                    </a>
                  </li>
                ))}
                {post.contactEmails.map((email) => (
                  <li key={email}>
                    <a href={`mailto:${email}`} className="font-medium text-accent hover:underline">
                      {email}
                    </a>
                  </li>
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

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-3xl gap-2">
          {primaryPhone ? (
            <a
              href={phoneHref(primaryPhone)}
              className="flex-1 rounded-full bg-rose-600 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              전화하기
            </a>
          ) : primaryEmail ? (
            <a
              href={`mailto:${primaryEmail}`}
              className="flex-1 rounded-full bg-rose-600 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              이메일 보내기
            </a>
          ) : null}
          <a
            href={post.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-full border border-border bg-surface px-4 py-3 text-center text-sm font-semibold text-foreground"
          >
            원문 보기
          </a>
        </div>
      </div>
    </div>
  );
}
