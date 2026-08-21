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
import { BackLink } from "@/components/back-link";
import { BookmarkButton } from "@/components/bookmark-button";
import { DirectApplyControls } from "@/components/direct-apply-controls";
import { OriginalDescription } from "@/components/original-description";
import { OriginalSourceLink } from "@/components/original-source-link";
import { AcademyGallery } from "@/components/academy-gallery";
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

  const payLabel = formatPay(
    job.payText ?? null,
    job.payMinManwon ?? null,
    job.payMaxManwon ?? null,
    job.representativePayText ?? job.representativePay?.displayText ?? null,
  );

  const sourceLinks = job.sources.map((source) => ({
    href: source.sourceUrl,
    label: formatSource(source.source),
    title: formatSource(source.source),
  }));

  return (
    <div className="min-h-full bg-surface-muted pb-24 sm:pb-0">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-5">
          <BackLink href="/" className="text-sm font-medium text-accent hover:text-accent">
            ← 목록으로
          </BackLink>
          {session?.user ? (
            <BookmarkButton jobPostId={id} initialBookmarked={bookmarked} />
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:border-accent-border hover:text-accent"
            >
              로그인 후 저장
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="rose">{formatJobType(job.jobType ?? null)}</Badge>
            {displayableTimeSlots(job.timeSlots).map((slot) => (
              <Badge key={slot}>{formatTimeSlot(slot)}</Badge>
            ))}
          </div>

          <h1 className="text-2xl font-bold leading-tight text-foreground">{job.title}</h1>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            {job.organization ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">학원/회사</dt>
                <dd className="mt-1">
                  <Link
                    href={`/organizations/${job.organization.id}`}
                    className="inline-flex flex-wrap items-center gap-2 font-medium text-accent hover:underline"
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
                {formatLocation(job.sido ?? null, job.sigungu ?? null, job.dongOrStation ?? null)}
              </dd>
              {job.locationText ? (
                <dd className="mt-1 text-xs text-muted-foreground">{job.locationText}</dd>
              ) : null}
            </div>
            <div>
              <dt className="text-muted-foreground">게시일</dt>
              <dd className="mt-1 font-medium text-foreground">{formatPostedAt(job.postedAt ?? null)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">요일</dt>
              <dd className="mt-1 font-medium text-foreground">
                {formatDayGroups(job.dayGroups, job.days)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">급여</dt>
              <dd className="mt-1 font-medium text-foreground">{payLabel}</dd>
            </div>
          </dl>

          {job.displaySections.length > 0 ? (
            <section className="mt-8 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">정돈된 공고</h2>
              {job.displaySections
                .filter((section) => !(job.organization && section.title.trim() === "학원명"))
                .map((section) => (
                <div key={section.title} className="rounded-2xl border border-border bg-surface-muted/70 p-4">
                  <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                  <p className="mt-2 whitespace-break-spaces text-sm leading-7 text-foreground">{section.content}</p>
                </div>
              ))}
            </section>
          ) : null}

          <AcademyGallery logoUrl={job.academyLogoUrl} gallery={job.academyGallery} />

          {job.description ? <OriginalDescription description={job.description} /> : null}

          <section className="mt-8">
            <h2 className="text-sm font-semibold text-foreground">원본 링크</h2>
            <div className="mt-3 space-y-3">
              {job.sources.map((source) => (
                <OriginalSourceLink
                  key={source.id}
                  href={source.sourceUrl}
                  title={formatSource(source.source)}
                  className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 transition hover:border-accent-border hover:bg-accent-subtle/60"
                >
                  <div>
                    <p className="font-medium text-foreground">{formatSource(source.source)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{source.sourcePost.title}</p>
                  </div>
                  <span className="text-sm font-medium text-accent">바로가기</span>
                </OriginalSourceLink>
              ))}
            </div>
            <DirectApplyControls
              postTitle={job.title}
              contactPhones={job.contactPhones}
              contactEmails={job.contactEmails}
              contactMethods={job.contactMethods}
              sourceLinks={sourceLinks}
            />
          </section>
        </article>
      </main>
    </div>
  );
}
