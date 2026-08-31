import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@balink/db";
import {
  displayableTimeSlots,
  extractApplyLinks,
  formatDayGroups,
  formatJobType,
  formatLocation,
  formatOrganizationType,
  formatPay,
  formatPostedAt,
  formatSource,
  formatTimeSlot,
  hasDirectApplyContacts,
} from "@balink/domain";
import { Badge } from "@balink/ui/badge";
import { auth } from "@/auth";
import { AcademyGallery } from "@/components/academy-gallery";
import { AmplitudePageView } from "@/components/amplitude-page-view";
import { BackLink } from "@/components/back-link";
import { DirectApplyControls } from "@/components/direct-apply-controls";
import { ExternalLinkIcon } from "@/components/external-link-icon";
import { JsonLd } from "@/components/json-ld";
import { LinkifiedText } from "@/components/linkified-text";
import { MotionReveal } from "@/components/motion-reveal";
import { OriginalDescription } from "@/components/original-description";
import { OriginalSourceLink } from "@/components/original-source-link";
import { PayHero } from "@/components/pay-hero";
import { AmplitudeEventName } from "@/lib/amplitude-events";
import { fetchJobPost } from "@/lib/graphql/queries";
import {
  breadcrumbJsonLd,
  buildJobDescription,
  buildPageMetadata,
  jobPostingJsonLd,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await fetchJobPost(id);

  if (!job) {
    return buildPageMetadata({
      title: "채용 공고",
      path: `/jobs/${id}`,
      noIndex: true,
    });
  }

  const location = formatLocation(
    job.sido ?? null,
    job.sigungu ?? null,
    job.dongOrStation ?? null,
  );
  const payLabel = formatPay(
    job.payText ?? null,
    job.payMinManwon ?? null,
    job.payMaxManwon ?? null,
    job.representativePayText ?? job.representativePay?.displayText ?? null,
  );

  return buildPageMetadata({
    title: job.title,
    description: buildJobDescription({
      title: job.title,
      location: location === "지역 미상" ? null : location,
      pay: payLabel === "협의" ? null : payLabel,
      description: job.description,
    }),
    path: `/jobs/${job.id}`,
    type: "article",
  });
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const [job, session] = await Promise.all([fetchJobPost(id), auth()]);

  if (!job) notFound();

  const bookmarked = session?.user?.id
    ? Boolean(
        await prisma.jobBookmark.findUnique({
          where: {
            userId_jobPostId: {
              userId: session.user.id,
              jobPostId: id,
            },
          },
          select: { id: true },
        }),
      )
    : false;

  const payMin = job.payMinManwon ?? null;
  const payMax = job.payMaxManwon ?? null;
  const payLabel = formatPay(
    job.payText ?? null,
    payMin,
    payMax,
    job.representativePayText ?? job.representativePay?.displayText ?? null,
  );

  const sourceLinks = job.sources.map((source) => ({
    href: source.sourceUrl,
    label: formatSource(source.source),
    title: formatSource(source.source),
  }));

  const cleanedSections = job.displaySections.filter(
    (section) => !(job.organization && section.title.trim() === "학원명"),
  );
  const applyLinks = extractApplyLinks({
    displaySections: cleanedSections,
    texts: job.description ? [job.description] : [],
  });
  const hasDirectApply = hasDirectApplyContacts({
    phones: job.contactPhones,
    emails: job.contactEmails,
    links: applyLinks,
  });
  const hasGallery = Boolean(job.academyLogoUrl) || job.academyGallery.length > 0;
  const timeSlots = displayableTimeSlots(job.timeSlots);
  const timeSlotLabel = timeSlots.map((slot) => formatTimeSlot(slot)).join(" · ");
  const detailAnalytics = { postKind: "job" as const, postId: id };

  return (
    <main className="detail-page-main page-bg-radial flex min-h-full flex-1 flex-col pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
      <AmplitudePageView
        event={AmplitudeEventName.ViewedJobDetail}
        props={{
          screen: "job_detail",
          post_kind: "job",
          post_id: id,
          organization_id: job.organization?.id ?? null,
          job_type: job.jobType ?? null,
          sido: job.sido ?? null,
          sigungu: job.sigungu ?? null,
          has_direct_apply: hasDirectApply,
          is_bookmarked: bookmarked,
        }}
      />
      <JsonLd
        data={[
          jobPostingJsonLd({
            id: job.id,
            title: job.title,
            description: job.description,
            locationText: job.locationText,
            sido: job.sido,
            sigungu: job.sigungu,
            postedAt: job.postedAt,
            updatedAt: job.updatedAt,
            payMinManwon: payMin,
            payMaxManwon: payMax,
            payText: payLabel,
            organizationName: job.organization?.name,
            employmentType: job.jobType,
          }),
          breadcrumbJsonLd([
            { name: "채용", path: "/" },
            { name: job.title, path: `/jobs/${job.id}` },
          ]),
        ]}
      />
      <div className="mx-auto w-full max-w-lg px-6 py-8">
        <MotionReveal index={0} variant="fade-in">
          <BackLink
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← 목록으로
          </BackLink>
        </MotionReveal>

        <MotionReveal index={1} variant="fade-up" className="mt-6 pb-8">
          <div className="flex flex-wrap gap-2">
            <Badge variant="rose">{formatJobType(job.jobType ?? null)}</Badge>
            {timeSlots.map((slot) => (
              <Badge key={slot}>{formatTimeSlot(slot)}</Badge>
            ))}
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            {job.title}
          </h1>
          <div className="mt-5">
            <PayHero
              payMin={payMin}
              payMax={payMax}
              payLabel={payLabel}
            />
          </div>
        </MotionReveal>

        <MotionReveal index={2} variant="fade-up">
          <section className="border-t border-border py-7">
            <h2 className="text-base font-semibold text-foreground">기본 정보</h2>
            <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
              {job.organization ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">학원/회사</dt>
                  <dd className="mt-1">
                    <Link
                      href={`/organizations/${job.organization.id}`}
                      className="inline-flex flex-wrap items-center gap-2 font-medium text-foreground hover:opacity-80"
                    >
                      <span>{job.organization.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatOrganizationType(job.organization.type)}
                      </span>
                    </Link>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-muted-foreground">지역</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatLocation(
                    job.sido ?? null,
                    job.sigungu ?? null,
                    job.dongOrStation ?? null,
                  )}
                </dd>
                {job.locationText ? (
                  <dd className="mt-1 text-xs text-muted-foreground">
                    {job.locationText}
                  </dd>
                ) : null}
              </div>
              <div>
                <dt className="text-muted-foreground">게시일</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatPostedAt(job.postedAt ?? null)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">요일</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatDayGroups(job.dayGroups, job.days)}
                </dd>
              </div>
              {timeSlots.length > 0 ? (
                <div>
                  <dt className="text-muted-foreground">시간대</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {timeSlotLabel}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        </MotionReveal>

        {cleanedSections.length > 0 ? (
          <MotionReveal index={3} variant="fade-up">
            <section className="border-t border-border py-7">
              <div className="space-y-8">
                {cleanedSections.map((section) => (
                  <div key={section.title}>
                    <h2 className="text-base font-semibold text-foreground">
                      {section.title}
                    </h2>
                    <LinkifiedText
                      text={section.content}
                      className="mt-3 whitespace-break-spaces text-sm leading-7 text-foreground"
                    />
                  </div>
                ))}
              </div>
            </section>
          </MotionReveal>
        ) : null}

        {hasGallery ? (
          <MotionReveal index={4} variant="fade-up">
            <section className="border-t border-border py-7">
              <h2 className="text-base font-semibold text-foreground">
                학원 사진
              </h2>
              <div className="mt-5">
                <AcademyGallery
                  logoUrl={job.academyLogoUrl}
                  gallery={job.academyGallery}
                  embedded
                />
              </div>
            </section>
          </MotionReveal>
        ) : null}

        <MotionReveal index={5} variant="fade-up">
          <section className="border-t border-border py-7">
            <h2 className="text-base font-semibold text-foreground">원문</h2>
            {job.description ? (
              <div className="mt-3">
                <OriginalDescription description={job.description} embedded />
              </div>
            ) : null}
            {job.sources.length > 0 ? (
              <div className="mt-3">
                {job.sources.map((source) => (
                  <OriginalSourceLink
                    key={source.id}
                    href={source.sourceUrl}
                    title={formatSource(source.source)}
                    analytics={{
                      ...detailAnalytics,
                      sourceLabel: formatSource(source.source),
                    }}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-surface-muted px-4 py-3 text-sm font-semibold text-foreground transition hover:opacity-90"
                  >
                    <div className="min-w-0">
                      <p className="truncate">{formatSource(source.source)}</p>
                      <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                        {source.sourcePost.title}
                      </p>
                    </div>
                    <span aria-hidden className="shrink-0 text-muted-foreground">
                      <ExternalLinkIcon />
                    </span>
                  </OriginalSourceLink>
                ))}
              </div>
            ) : null}
          </section>
        </MotionReveal>

        {/* sticky CTA는 MotionReveal(transform) 밖에 두어 fixed가 뷰포트에 붙게 한다 */}
        <DirectApplyControls
          postTitle={job.title}
          contactPhones={job.contactPhones}
          contactEmails={job.contactEmails}
          contactMethods={job.contactMethods}
          applyLinks={applyLinks}
          sourceLinks={sourceLinks}
          analytics={detailAnalytics}
          bookmark={
            session?.user
              ? { jobPostId: id, initialBookmarked: bookmarked }
              : { loginHref: "/login" }
          }
        />
      </div>
    </main>
  );
}
