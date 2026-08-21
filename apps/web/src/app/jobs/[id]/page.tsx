import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@balink/db";
import {
  displayableTimeSlots,
  formatDayGroups,
  formatJobType,
  formatLocation,
  formatOrganizationType,
  formatPay,
  formatPostedAt,
  formatSource,
  formatTimeSlot,
} from "@balink/domain";
import { Badge } from "@balink/ui/badge";
import { auth } from "@/auth";
import { AcademyGallery } from "@/components/academy-gallery";
import { BackLink } from "@/components/back-link";
import { BookmarkButton } from "@/components/bookmark-button";
import { DirectApplyControls } from "@/components/direct-apply-controls";
import { MotionReveal } from "@/components/motion-reveal";
import { OriginalDescription } from "@/components/original-description";
import { OriginalSourceLink } from "@/components/original-source-link";
import { fetchJobPost } from "@/lib/graphql/queries";

export const dynamic = "force-dynamic";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
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
  const hasGallery = Boolean(job.academyLogoUrl) || job.academyGallery.length > 0;

  return (
    <main className="page-bg-radial flex min-h-full flex-1 flex-col pb-24 sm:pb-0">
      <div className="mx-auto w-full max-w-lg px-6 py-8">
        <MotionReveal index={0} variant="fade-in">
          <div className="flex items-center justify-between gap-3">
            <BackLink
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              ← 목록으로
            </BackLink>
            {session?.user ? (
              <BookmarkButton
                jobPostId={id}
                initialBookmarked={bookmarked}
                variant="icon"
              />
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-muted"
              >
                로그인 후 저장
              </Link>
            )}
          </div>
        </MotionReveal>

        <MotionReveal index={1} variant="fade-up" className="mt-6 pb-8">
          <div className="flex flex-wrap gap-2">
            <Badge variant="rose">{formatJobType(job.jobType ?? null)}</Badge>
            {displayableTimeSlots(job.timeSlots).map((slot) => (
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
                    <p className="mt-3 whitespace-break-spaces text-sm leading-7 text-foreground">
                      {section.content}
                    </p>
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
                    className="-mx-2 flex items-center justify-between px-2 py-3 text-sm font-semibold text-foreground hover:opacity-80"
                  >
                    <div className="min-w-0">
                      <p className="truncate">{formatSource(source.source)}</p>
                      <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                        {source.sourcePost.title}
                      </p>
                    </div>
                    <span aria-hidden className="shrink-0 text-muted-foreground">
                      →
                    </span>
                  </OriginalSourceLink>
                ))}
              </div>
            ) : null}
            <DirectApplyControls
              postTitle={job.title}
              contactPhones={job.contactPhones}
              contactEmails={job.contactEmails}
              contactMethods={job.contactMethods}
              sourceLinks={sourceLinks}
            />
          </section>
        </MotionReveal>
      </div>
    </main>
  );
}

function PayHero({
  payMin,
  payMax,
  payLabel,
}: {
  payMin: number | null;
  payMax: number | null;
  payLabel: string;
}) {
  if (payMin != null && payMax != null) {
    const amount =
      payMin === payMax ? String(payMin) : `${payMin}~${payMax}`;
    return (
      <p className="flex items-baseline gap-1.5 text-foreground">
        <span className="text-3xl font-bold tracking-tight tabular-nums">
          {amount}
        </span>
        <span className="text-base font-medium text-muted-foreground">만원</span>
      </p>
    );
  }

  if (payMin != null || payMax != null) {
    return (
      <p className="flex items-baseline gap-1.5 text-foreground">
        <span className="text-3xl font-bold tracking-tight tabular-nums">
          {payMin ?? payMax}
        </span>
        <span className="text-base font-medium text-muted-foreground">만원</span>
      </p>
    );
  }

  const match = payLabel.match(/^(.+?)(만원(?:대)?)$/);
  if (match) {
    return (
      <p className="flex items-baseline gap-1.5 text-foreground">
        <span className="text-3xl font-bold tracking-tight tabular-nums">
          {match[1].trim()}
        </span>
        <span className="text-base font-medium text-muted-foreground">
          {match[2]}
        </span>
      </p>
    );
  }

  return (
    <p className="text-lg font-semibold text-foreground">{payLabel}</p>
  );
}
