import { notFound } from "next/navigation";
import {
  formatAudienceType,
  formatLessonDates,
  formatLocation,
  formatPay,
  formatPostedAt,
  formatRecurrenceSummary,
  formatSubjectType,
  formatSubstituteSessionLabel,
  formatSubstituteSessionsCardLabel,
  formatSubstituteStatus,
  formatSubstituteUrgency,
  resolveSubstituteUrgency,
} from "@balink/domain";
import { Badge } from "@balink/ui/badge";
import { BackLink } from "@/components/back-link";
import { DirectApplyControls } from "@/components/direct-apply-controls";
import { fetchSubstitutePost } from "@/lib/graphql/queries";

export const dynamic = "force-dynamic";

interface SubstituteDetailPageProps {
  params: Promise<{ id: string }>;
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
  const payLabel = formatPay(
    post.payText ?? null,
    post.representativePay?.minManwon ?? null,
    post.representativePay?.maxManwon ?? null,
    post.representativePayText ?? post.representativePay?.displayText ?? null,
  );

  return (
    <div className="min-h-full bg-surface-muted pb-24 sm:pb-0">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-5">
          <BackLink
            href="/substitutes"
            className="text-sm font-medium text-accent hover:text-accent"
          >
            ← 대강 게시판
          </BackLink>
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
                {post.locationText && hasNormalizedLocation ? (
                  <p className="mt-1 text-xs text-muted-foreground">{post.locationText}</p>
                ) : null}
              </div>
              <div>
                <p className="text-muted-foreground">급여</p>
                <p className="mt-1 font-bold text-accent">{payLabel}</p>
              </div>
            </div>
            <DirectApplyControls
              postTitle={post.title}
              contactPhones={post.contactPhones}
              contactEmails={post.contactEmails}
              contactMethods={post.contactMethods}
              sourceLinks={[{ href: post.sourceUrl, label: "원문", title: "원문" }]}
            />
          </section>

          <h1 className="text-2xl font-bold leading-tight text-foreground">{post.title}</h1>
          {post.summary ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{post.summary}</p> : null}

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">게시일</dt>
              <dd className="mt-1 font-medium text-foreground">{formatPostedAt(post.postedAt ?? null)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">지역</dt>
              <dd className="mt-1 font-medium text-foreground">{locationLabel}</dd>
              {post.locationText && hasNormalizedLocation ? (
                <dd className="mt-1 text-xs text-muted-foreground">{post.locationText}</dd>
              ) : null}
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
                  <li
                    key={`${session.date}-${session.startTime}-${index}`}
                    className="rounded-2xl bg-surface-muted p-4 text-sm"
                  >
                    <div className="font-medium text-foreground">
                      {formatSubstituteSessionLabel(session)}
                    </div>
                    <div className="mt-2 text-muted-foreground">
                      대상:{" "}
                      {session.audienceTypes.map(formatAudienceType).filter(Boolean).join(", ") ||
                        "미상"}{" "}
                      · 장르:{" "}
                      {session.subjectTypes.map(formatSubjectType).filter(Boolean).join(", ") ||
                        "미상"}
                    </div>
                    {session.pay && (session.pay.minManwon != null || session.pay.maxManwon != null) ? (
                      <div className="mt-1 text-muted-foreground">
                        급여:{" "}
                        {formatPay(null, session.pay.minManwon ?? null, session.pay.maxManwon ?? null, null)}
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

        </article>
      </main>
    </div>
  );
}
