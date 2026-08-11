import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@balink/db";
import {
  displayableTimeSlots,
  formatDayGroups,
  formatJobType,
  formatLocation,
  formatPay,
  formatPostedAt,
  formatSource,
  formatTimeSlot,
} from "@balink/domain";
import { Badge } from "@balink/ui/badge";
import { auth } from "@/auth";
import { BookmarkButton } from "@/components/bookmark-button";
import { OriginalDescription } from "@/components/original-description";
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

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-5">
          <Link href="/" className="text-sm font-medium text-rose-600 hover:text-rose-700">
            ← 목록으로
          </Link>
          {session?.user ? (
            <BookmarkButton jobPostId={id} initialBookmarked={bookmarked} />
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-rose-200 hover:text-rose-700"
            >
              로그인 후 저장
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="rose">{formatJobType(job.jobType ?? null)}</Badge>
            {displayableTimeSlots(job.timeSlots).map((slot) => (
              <Badge key={slot}>{formatTimeSlot(slot)}</Badge>
            ))}
          </div>

          <h1 className="text-2xl font-bold leading-tight text-zinc-900">{job.title}</h1>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">지역</dt>
              <dd className="mt-1 font-medium text-zinc-900">
                {formatLocation(job.sido ?? null, job.sigungu ?? null, job.dongOrStation ?? null)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">게시일</dt>
              <dd className="mt-1 font-medium text-zinc-900">{formatPostedAt(job.postedAt ?? null)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">요일</dt>
              <dd className="mt-1 font-medium text-zinc-900">
                {formatDayGroups(job.dayGroups, job.days)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">급여</dt>
              <dd className="mt-1 font-medium text-zinc-900">{payLabel}</dd>
              {job.representativePay?.evidence ? (
                <dd className="mt-1 text-xs text-zinc-500">근거: {job.representativePay.evidence}</dd>
              ) : null}
            </div>
          </dl>

          {job.displaySections.length > 0 ? (
            <section className="mt-8 space-y-4">
              <h2 className="text-sm font-semibold text-zinc-900">정돈된 공고</h2>
              {job.displaySections.map((section) => (
                <div key={section.title} className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                  <h3 className="text-sm font-semibold text-zinc-900">{section.title}</h3>
                  <p className="mt-2 whitespace-break-spaces text-sm leading-7 text-zinc-700">{section.content}</p>
                </div>
              ))}
            </section>
          ) : null}

          <AcademyGallery logoUrl={job.academyLogoUrl} gallery={job.academyGallery} />

          {job.description ? <OriginalDescription description={job.description} /> : null}

          <section className="mt-8">
            <h2 className="text-sm font-semibold text-zinc-900">원본 링크</h2>
            <div className="mt-3 space-y-3">
              {job.sources.map((source) => (
                <a
                  key={source.id}
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-zinc-200 px-4 py-3 transition hover:border-rose-200 hover:bg-rose-50/40"
                >
                  <div>
                    <p className="font-medium text-zinc-900">{formatSource(source.source)}</p>
                    <p className="mt-1 text-sm text-zinc-500">{source.sourcePost.title}</p>
                  </div>
                  <span className="text-sm font-medium text-rose-600">바로가기</span>
                </a>
              ))}
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
