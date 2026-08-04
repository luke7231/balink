import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma, toJobPostSummary } from "@black-swan/db";
import { JobList } from "@black-swan/ui/job-list";
import { auth } from "@/auth";
import { BookmarkButton } from "@/components/bookmark-button";
import { SiteHeader } from "@/components/site-header";
import { fetchHealth } from "@/lib/graphql/queries";

export const dynamic = "force-dynamic";

export default async function SavedJobsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [health, bookmarks] = await Promise.all([
    fetchHealth(),
    prisma.jobBookmark.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { jobPost: true },
    }),
  ]);

  const jobs = bookmarks.map((bookmark) => toJobPostSummary(bookmark.jobPost));

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffcfd_0%,#ffffff_140px)]">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="mb-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">저장한 공고</h2>
              <p className="mt-1 text-sm text-zinc-500">관심 있는 채용 공고를 모아 보세요.</p>
            </div>
            <p className="text-sm font-medium text-zinc-500">{jobs.length}개</p>
          </div>
        </section>

        {jobs.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-sm text-zinc-600">아직 저장한 공고가 없습니다.</p>
            <Link
              href="/"
              className="mt-4 inline-flex rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              채용공고 보러가기
            </Link>
          </div>
        ) : (
          <JobList
            jobs={jobs}
            getHref={(job) => `/jobs/${job.id}`}
            linkComponent={Link}
            renderAction={(job) => (
              <BookmarkButton jobPostId={job.id} initialBookmarked variant="icon" />
            )}
          />
        )}
      </main>
    </div>
  );
}
