import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@balink/db";
import {
  extractApplyLinks,
  formatAudienceType,
  formatLocation,
  formatPay,
  formatPostedAt,
  formatSubjectType,
  formatSubstituteSessionLabel,
  formatSubstituteStatus,
  formatSubstituteUrgency,
  hasDirectApplyContacts,
  resolveSubstituteUrgency,
} from "@balink/domain";
import { Badge } from "@balink/ui/badge";
import { auth } from "@/auth";
import { AmplitudePageView } from "@/components/amplitude-page-view";
import { BackLink } from "@/components/back-link";
import { DirectApplyControls } from "@/components/direct-apply-controls";
import { ExternalLinkIcon } from "@/components/external-link-icon";
import { JsonLd } from "@/components/json-ld";
import { MotionReveal } from "@/components/motion-reveal";
import { OriginalDescription } from "@/components/original-description";
import { OriginalSourceLink } from "@/components/original-source-link";
import { PayHero } from "@/components/pay-hero";
import {
  resolveSubstituteSchedule,
  SubstituteScheduleView,
} from "@/components/substitute-schedule";
import { AmplitudeEventName } from "@/lib/amplitude-events";
import { fetchSubstitutePost } from "@/lib/graphql/queries";
import {
  breadcrumbJsonLd,
  buildJobDescription,
  buildPageMetadata,
  jobPostingJsonLd,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

interface SubstituteDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: SubstituteDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await fetchSubstitutePost(id);

  if (!post) {
    return buildPageMetadata({
      title: "대강 공고",
      path: `/substitutes/${id}`,
      noIndex: true,
    });
  }

  const location = formatLocation(
    post.sido ?? null,
    post.sigungu ?? null,
    post.dongOrStation ?? null,
  );
  const payLabel = formatPay(
    post.payText ?? null,
    post.representativePay?.minManwon ?? null,
    post.representativePay?.maxManwon ?? null,
    post.representativePayText ?? post.representativePay?.displayText ?? null,
  );

  return buildPageMetadata({
    title: post.title,
    description: buildJobDescription({
      title: post.title,
      location: location === "지역 미상" ? null : location,
      pay: payLabel === "협의" ? null : payLabel,
      description: post.summary ?? post.body,
    }),
    path: `/substitutes/${post.id}`,
    type: "article",
  });
}

export default async function SubstituteDetailPage({
  params,
}: SubstituteDetailPageProps) {
  const { id } = await params;
  const [post, session] = await Promise.all([fetchSubstitutePost(id), auth()]);

  if (!post) notFound();

  const bookmarked = session?.user?.id
    ? Boolean(
        await prisma.substituteBookmark.findUnique({
          where: {
            userId_substitutePostId: {
              userId: session.user.id,
              substitutePostId: id,
            },
          },
          select: { id: true },
        }),
      )
    : false;

  const urgencyValue = resolveSubstituteUrgency({
    sessions: post.sessions,
    nextLessonAt: post.nextLessonAt,
  });
  const urgencyLabel = formatSubstituteUrgency(urgencyValue);
  const explicitSessions = post.sessions.filter(
    (session) => session.origin !== "recurrence",
  );
  const schedule = resolveSubstituteSchedule({
    scheduleKind: post.scheduleKind,
    sessions: post.sessions,
    recurrence: post.recurrence,
    lessonDates: post.lessonDates,
  });
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
  const payMin = post.representativePay?.minManwon ?? null;
  const payMax = post.representativePay?.maxManwon ?? null;
  const payLabel = formatPay(
    post.payText ?? null,
    payMin,
    payMax,
    post.representativePayText ?? post.representativePay?.displayText ?? null,
  );
  const sourceLinks = [
    { href: post.sourceUrl, label: "원문", title: "원문" },
  ];
  const applyLinks = extractApplyLinks({
    texts: [post.body, post.summary].filter(Boolean) as string[],
  });
  const hasDirectApply = hasDirectApplyContacts({
    phones: post.contactPhones,
    emails: post.contactEmails,
    links: applyLinks,
  });
  const detailAnalytics = { postKind: "substitute" as const, postId: id };

  return (
    <main className="page-bg-radial flex min-h-full flex-1 flex-col pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
      <AmplitudePageView
        event={AmplitudeEventName.ViewedSubstituteDetail}
        props={{
          screen: "substitute_detail",
          post_kind: "substitute",
          post_id: id,
          status: post.status ?? null,
          urgency: urgencyValue ?? null,
          sido: post.sido ?? null,
          sigungu: post.sigungu ?? null,
          has_direct_apply: hasDirectApply,
          is_bookmarked: bookmarked,
        }}
      />
      <JsonLd
        data={[
          jobPostingJsonLd({
            id: post.id,
            title: post.title,
            description: post.summary ?? post.body,
            locationText: post.locationText,
            sido: post.sido,
            sigungu: post.sigungu,
            postedAt: post.postedAt,
            updatedAt: post.updatedAt,
            payMinManwon: payMin,
            payMaxManwon: payMax,
            payText: payLabel,
            organizationName: post.academyName,
            employmentType: "TEMPORARY",
          }),
          breadcrumbJsonLd([
            { name: "대강", path: "/substitutes" },
            { name: post.title, path: `/substitutes/${post.id}` },
          ]),
        ]}
      />
      <div className="mx-auto w-full max-w-lg px-6 py-8">
        <MotionReveal index={0} variant="fade-in">
          <BackLink
            href="/substitutes"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← 대강 게시판
          </BackLink>
        </MotionReveal>

        <MotionReveal index={1} variant="fade-up" className="mt-6 pb-8">
          <div className="flex flex-wrap gap-2">
            {urgencyLabel ? <Badge variant="rose">{urgencyLabel}</Badge> : null}
            <Badge>{formatSubstituteStatus(post.status)}</Badge>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            {post.title}
          </h1>
          {post.summary ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {post.summary}
            </p>
          ) : null}
          <div className="mt-5">
            <PayHero payMin={payMin} payMax={payMax} payLabel={payLabel} />
          </div>
        </MotionReveal>

        <MotionReveal index={2} variant="fade-up">
          <section className="border-t border-border py-7">
            <h2 className="text-base font-semibold text-foreground">기본 정보</h2>
            <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">게시일</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatPostedAt(post.postedAt ?? null)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">지역</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {locationLabel}
                </dd>
                {post.locationText && hasNormalizedLocation ? (
                  <dd className="mt-1 text-xs text-muted-foreground">
                    {post.locationText}
                  </dd>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">일정</dt>
                <dd className="mt-2">
                  <SubstituteScheduleView schedule={schedule} />
                </dd>
              </div>
              {post.academyName ? (
                <div>
                  <dt className="text-muted-foreground">학원명</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {post.academyName}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        </MotionReveal>

        {explicitSessions.length > 0 ? (
          <MotionReveal index={3} variant="fade-up">
            <section className="border-t border-border py-7">
              <div className="space-y-8">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    수업 세션
                  </h2>
                  <ul className="mt-4 space-y-4">
                    {explicitSessions.map((session, index) => (
                      <li
                        key={`${session.date}-${session.startTime}-${index}`}
                        className="rounded-2xl bg-surface-muted px-4 py-4 text-sm"
                      >
                        <div className="font-medium text-foreground">
                          {formatSubstituteSessionLabel(session)}
                        </div>
                        <div className="mt-2 text-muted-foreground">
                          대상:{" "}
                          {session.audienceTypes
                            .map(formatAudienceType)
                            .filter(Boolean)
                            .join(", ") || "미상"}{" "}
                          · 장르:{" "}
                          {session.subjectTypes
                            .map(formatSubjectType)
                            .filter(Boolean)
                            .join(", ") || "미상"}
                        </div>
                        {session.pay &&
                        (session.pay.minManwon != null ||
                          session.pay.maxManwon != null) ? (
                          <div className="mt-1 text-muted-foreground">
                            급여:{" "}
                            {formatPay(
                              null,
                              session.pay.minManwon ?? null,
                              session.pay.maxManwon ?? null,
                              null,
                            )}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </MotionReveal>
        ) : null}

        {post.requirements.length > 0 ? (
          <MotionReveal index={4} variant="fade-up">
            <section className="border-t border-border py-7">
              <h2 className="text-base font-semibold text-foreground">요건</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-foreground">
                {post.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </MotionReveal>
        ) : null}

        <MotionReveal index={5} variant="fade-up">
          <section className="border-t border-border py-7">
            <h2 className="text-base font-semibold text-foreground">원문</h2>
            {post.body ? (
              <div className="mt-3">
                <OriginalDescription description={post.body} embedded />
              </div>
            ) : null}
            <div className="mt-3">
              <OriginalSourceLink
                href={post.sourceUrl}
                title="원문"
                analytics={{ ...detailAnalytics, sourceLabel: "원문" }}
                className="flex items-center justify-between gap-3 rounded-2xl bg-surface-muted px-4 py-3 text-sm font-semibold text-foreground transition hover:opacity-90"
              >
                <span>자세히 보기</span>
                <span aria-hidden className="shrink-0 text-muted-foreground">
                  <ExternalLinkIcon />
                </span>
              </OriginalSourceLink>
            </div>
          </section>
        </MotionReveal>

        {/* sticky CTA는 MotionReveal(transform) 밖에 두어 fixed가 뷰포트에 붙게 한다 */}
        <DirectApplyControls
          postTitle={post.title}
          contactPhones={post.contactPhones}
          contactEmails={post.contactEmails}
          contactMethods={post.contactMethods}
          applyLinks={applyLinks}
          sourceLinks={sourceLinks}
          analytics={detailAnalytics}
          bookmark={
            session?.user
              ? { substitutePostId: id, initialBookmarked: bookmarked }
              : { loginHref: "/login" }
          }
        />
      </div>
    </main>
  );
}
