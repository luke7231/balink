import Link from "next/link";
import { prisma, toJobPostSummary, toSubstitutePostSummary } from "@balink/db";
import { JobList } from "@balink/ui/job-list";
import { auth } from "@/auth";
import { BookmarkButton } from "@/components/bookmark-button";
import { LoginScreen } from "@/components/login-screen";
import { MotionReveal } from "@/components/motion-reveal";
import { SiteHeader } from "@/components/site-header";
import {
  SubstituteList,
  type SubstituteCardData,
} from "@/components/substitute-list";
import { fetchHealth } from "@/lib/graphql/queries";

export const dynamic = "force-dynamic";

type SavedTab = "jobs" | "substitutes";

function resolveTab(raw: string | string[] | undefined): SavedTab {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "substitutes" ? "substitutes" : "jobs";
}

function toCardData(
  summary: ReturnType<typeof toSubstitutePostSummary>,
): SubstituteCardData {
  return {
    ...summary,
    postedAt: summary.postedAt?.toISOString() ?? null,
    nextLessonAt: summary.nextLessonAt?.toISOString() ?? null,
    createdAt: summary.createdAt.toISOString(),
    updatedAt: summary.updatedAt.toISOString(),
  };
}

export default async function SavedJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    // Stay on the Bookmarks tab root (same pattern as /account).
    return <LoginScreen showBrowseLink={false} />;
  }

  const params = await searchParams;
  const tab = resolveTab(params.tab);

  const [health, jobBookmarks, substituteBookmarks] = await Promise.all([
    fetchHealth(),
    prisma.jobBookmark.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { jobPost: true },
    }),
    prisma.substituteBookmark.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { substitutePost: true },
    }),
  ]);

  const jobs = jobBookmarks.map((bookmark) => toJobPostSummary(bookmark.jobPost));
  const substitutes = substituteBookmarks.map((bookmark) =>
    toCardData(toSubstitutePostSummary(bookmark.substitutePost)),
  );

  const isJobs = tab === "jobs";

  return (
    <div className="min-h-full page-bg">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <MotionReveal index={0} variant="fade-in">
          <section className="mb-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {isJobs ? "저장한 공고" : "저장한 대강"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isJobs
                  ? "관심 있는 채용 공고를 모아 보세요."
                  : "관심 있는 대강 글을 모아 보세요."}
              </p>
            </div>

            <div
              role="tablist"
              aria-label="저장 목록 구분"
              className="mt-5 flex gap-1 rounded-full bg-surface-muted p-1"
            >
              <Link
                href="/saved?tab=jobs"
                role="tab"
                aria-selected={isJobs}
                className={`flex-1 rounded-full px-4 py-2.5 text-center text-sm font-semibold transition ${
                  isJobs
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                채용{" "}
                <span className="tabular-nums font-medium text-muted-foreground">
                  {jobs.length}
                </span>
              </Link>
              <Link
                href="/saved?tab=substitutes"
                role="tab"
                aria-selected={!isJobs}
                className={`flex-1 rounded-full px-4 py-2.5 text-center text-sm font-semibold transition ${
                  !isJobs
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                대강{" "}
                <span className="tabular-nums font-medium text-muted-foreground">
                  {substitutes.length}
                </span>
              </Link>
            </div>
          </section>
        </MotionReveal>

        <MotionReveal index={1} variant="fade-up">
          {isJobs ? (
            jobs.length === 0 ? (
              <div className="rounded-3xl bg-surface-muted px-6 py-12 text-center">
                <p className="text-base font-semibold text-foreground">저장한 공고가 없어요</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  관심 있는 채용 공고를 저장해 두면 여기서 다시 볼 수 있어요.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90"
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
            )
          ) : substitutes.length === 0 ? (
            <div className="rounded-3xl bg-surface-muted px-6 py-12 text-center">
              <p className="text-base font-semibold text-foreground">저장한 대강이 없어요</p>
              <p className="mt-2 text-sm text-muted-foreground">
                관심 있는 대강 글을 저장해 두면 여기서 다시 볼 수 있어요.
              </p>
              <Link
                href="/substitutes"
                className="mt-5 inline-flex rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90"
              >
                대강 보러가기
              </Link>
            </div>
          ) : (
            <SubstituteList
              posts={substitutes}
              getHref={(post) => `/substitutes/${post.id}`}
              linkComponent={Link}
              renderAction={(post) => (
                <BookmarkButton
                  substitutePostId={post.id}
                  initialBookmarked
                  variant="icon"
                />
              )}
            />
          )}
        </MotionReveal>
      </main>
    </div>
  );
}
