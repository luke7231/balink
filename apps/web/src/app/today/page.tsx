import type { Metadata } from "next";
import Link from "next/link";
import { toSubstitutePostSummary } from "@balink/db";
import { JobList } from "@balink/ui/job-list";
import { auth } from "@/auth";
import { BackLink } from "@/components/back-link";
import { BookmarkButton } from "@/components/bookmark-button";
import { EmptyStatePanel } from "@/components/empty-state-panel";
import { MotionReveal } from "@/components/motion-reveal";
import { SiteHeader } from "@/components/site-header";
import {
  SubstituteList,
  type SubstituteCardData,
} from "@/components/substitute-list";
import { TodaySigunguChips } from "@/components/today-sigungu-chips";
import { getBookmarkedJobIdSet } from "@/lib/job-bookmarks";
import { fetchHealth } from "@/lib/graphql/queries";
import { buildPageMetadata } from "@/lib/seo";
import { getBookmarkedSubstituteIdSet } from "@/lib/substitute-bookmarks";
import {
  buildTodayHref,
  parseTodaySigungus,
  resolveTodayTab,
} from "@/lib/today-filter-params";
import { fetchTodayPosts, filterBySigungu } from "@/lib/today-posts";
import { emptyCopy } from "@/lib/ui-copy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "오늘의 공고",
  description:
    "오늘 올라온 발레 강사 채용·대강 공고를 한곳에서 확인하세요. 지역별로 골라 볼 수 있어요.",
  path: "/today",
});

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

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string | string[];
    sigungu?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const tab = resolveTodayTab(params.tab);
  const selectedSigungus = parseTodaySigungus(params.sigungu);
  const isJobs = tab === "jobs";

  const session = await auth();
  const [health, today] = await Promise.all([fetchHealth(), fetchTodayPosts()]);

  const allJobs = today.jobs;
  const allSubstitutes = today.substitutes.map(toCardData);
  const jobs = filterBySigungu(allJobs, selectedSigungus);
  const substitutes = filterBySigungu(allSubstitutes, selectedSigungus);
  const chips = isJobs ? today.jobSigunguChips : today.substituteSigunguChips;

  const [bookmarkedJobs, bookmarkedSubstitutes] = await Promise.all([
    getBookmarkedJobIdSet(
      session?.user?.id,
      isJobs ? jobs.map((job) => job.id) : [],
    ),
    getBookmarkedSubstituteIdSet(
      session?.user?.id,
      !isJobs ? substitutes.map((post) => post.id) : [],
    ),
  ]);

  const emptyAll = isJobs ? allJobs.length === 0 : allSubstitutes.length === 0;
  const emptyFiltered =
    !emptyAll && (isJobs ? jobs.length === 0 : substitutes.length === 0);

  return (
    <div className="min-h-full page-bg">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <MotionReveal index={0} variant="fade-in">
          <BackLink
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← 홈으로
          </BackLink>
        </MotionReveal>

        <MotionReveal index={1} variant="fade-up">
          <section className="mb-6 mt-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                오늘의 공고
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                오늘 올라온 채용·대강을 모아 봤어요.
              </p>
            </div>

            <div
              role="tablist"
              aria-label="오늘의 공고 구분"
              className="mt-5 flex gap-1 rounded-full bg-surface-muted p-1"
            >
              <Link
                href={buildTodayHref("jobs")}
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
                  {allJobs.length}
                </span>
              </Link>
              <Link
                href={buildTodayHref("substitutes")}
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
                  {allSubstitutes.length}
                </span>
              </Link>
            </div>
          </section>
        </MotionReveal>

        <MotionReveal index={2} variant="fade-up">
          {!emptyAll ? (
            <TodaySigunguChips tab={tab} chips={chips} selected={selectedSigungus} />
          ) : null}

          {emptyAll ? (
            <EmptyStatePanel
              variant="muted"
              title={
                isJobs
                  ? emptyCopy.todayJobs.title
                  : emptyCopy.todaySubstitutes.title
              }
              description={
                isJobs
                  ? emptyCopy.todayJobs.description
                  : emptyCopy.todaySubstitutes.description
              }
            >
              <Link
                href={isJobs ? "/" : "/substitutes"}
                className="mt-5 inline-flex rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90"
              >
                {isJobs
                  ? emptyCopy.todayJobs.cta
                  : emptyCopy.todaySubstitutes.cta}
              </Link>
            </EmptyStatePanel>
          ) : emptyFiltered ? (
            <EmptyStatePanel
              variant="muted"
              title={emptyCopy.todayFiltered.title}
              description={emptyCopy.todayFiltered.description}
            >
              <Link
                href={buildTodayHref(tab)}
                className="mt-5 inline-flex rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90"
              >
                {emptyCopy.todayFiltered.cta}
              </Link>
            </EmptyStatePanel>
          ) : isJobs ? (
            <JobList
              jobs={jobs}
              getHref={(job) => `/jobs/${job.id}`}
              linkComponent={Link}
              renderAction={(job) => (
                <BookmarkButton
                  jobPostId={job.id}
                  initialBookmarked={bookmarkedJobs.has(job.id)}
                  variant="icon"
                />
              )}
            />
          ) : (
            <SubstituteList
              posts={substitutes}
              getHref={(post) => `/substitutes/${post.id}`}
              linkComponent={Link}
              renderAction={(post) => (
                <BookmarkButton
                  substitutePostId={post.id}
                  initialBookmarked={bookmarkedSubstitutes.has(post.id)}
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
