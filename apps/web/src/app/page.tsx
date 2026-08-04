import Link from "next/link";
import { JobList } from "@black-swan/ui/job-list";
import { auth } from "@/auth";
import { BookmarkButton } from "@/components/bookmark-button";
import { SiteHeader } from "@/components/site-header";
import { fetchHealth, fetchJobPosts, fetchJobRegions } from "@/lib/graphql/queries";
import { getBookmarkedJobIdSet } from "@/lib/job-bookmarks";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{
    sido?: string;
    sigungu?: string;
    region?: string;
  }>;
}

function buildJobsHref(sido?: string, sigungu?: string): string {
  const params = new URLSearchParams();
  if (sido) params.set("sido", sido);
  if (sigungu) params.set("sigungu", sigungu);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function parseRegionParams(query: { sido?: string; sigungu?: string; region?: string }) {
  const [regionSido, regionSigungu] = (query.region ?? "").split("::");
  const selectedSido = query.sido?.trim() || regionSido?.trim() || "";
  const selectedSigungu = query.sigungu?.trim() || regionSigungu?.trim() || "";
  return { selectedSido, selectedSigungu };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const query = await searchParams;
  const { selectedSido, selectedSigungu } = parseRegionParams(query);
  const filter = {
    ...(selectedSido ? { sido: selectedSido } : {}),
    ...(selectedSigungu ? { sigungu: selectedSigungu } : {}),
  };

  const session = await auth();
  const [health, jobs, regions] = await Promise.all([
    fetchHealth(),
    fetchJobPosts(1, 40, Object.keys(filter).length ? filter : null),
    fetchJobRegions(),
  ]);
  const bookmarkedIds = await getBookmarkedJobIdSet(
    session?.user?.id,
    jobs.items.map((job) => job.id),
  );

  const sidoOptions = regions.map((region) => ({
    value: region.sido,
    count: region.districts.reduce((sum, district) => sum + district.count, 0),
  }));
  const selectedDistricts = regions.find((region) => region.sido === selectedSido)?.districts ?? [];
  const hasFilter = Boolean(selectedSido || selectedSigungu);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffcfd_0%,#ffffff_140px)]">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="mb-8 rounded-3xl bg-zinc-900 px-6 py-8 text-white">
          <h2 className="text-2xl font-semibold leading-tight">
            조건에 맞는 발레 공고를
            <br />
            한곳에서 확인하세요
          </h2>
        </section>

        <section aria-label="채용 공고 필터" className="mb-8 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              aria-current={!selectedSido ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                !selectedSido
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-rose-200 hover:text-rose-700"
              }`}
            >
              전체 지역
            </Link>
            {sidoOptions.map((option) => {
              const isSelected = selectedSido === option.value && !selectedSigungu;
              return (
                <Link
                  key={option.value}
                  href={buildJobsHref(option.value)}
                  aria-current={isSelected ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isSelected || (selectedSido === option.value && selectedSigungu)
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:border-rose-200 hover:text-rose-700"
                  }`}
                >
                  {option.value}
                  <span className="ml-1 text-xs opacity-70">{option.count}</span>
                </Link>
              );
            })}
          </div>

          <form action="/" className="mt-4 flex flex-col gap-2 sm:flex-row">
            {selectedSido ? <input type="hidden" name="sido" value={selectedSido} /> : null}
            <label className="sr-only" htmlFor="job-region">
              시군구 선택
            </label>
            <select
              id="job-region"
              name={selectedSido ? "sigungu" : "region"}
              defaultValue={
                selectedSido
                  ? selectedSigungu
                  : selectedSido || selectedSigungu
                    ? `${selectedSido}::${selectedSigungu}`
                    : ""
              }
              className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            >
              <option value="">{selectedSido ? `${selectedSido} 전체` : "시·군·구 선택"}</option>
              {selectedSido
                ? selectedDistricts.map((district) => (
                    <option key={district.sigungu} value={district.sigungu}>
                      {district.sigungu} ({district.count})
                    </option>
                  ))
                : regions.flatMap((region) =>
                    region.districts.map((district) => (
                      <option
                        key={`${region.sido}::${district.sigungu}`}
                        value={`${region.sido}::${district.sigungu}`}
                      >
                        {region.sido} {district.sigungu} ({district.count})
                      </option>
                    )),
                  )}
            </select>
            <button
              type="submit"
              className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700"
            >
              지역 적용
            </button>
            {hasFilter ? (
              <Link
                href="/"
                className="rounded-2xl px-4 py-3 text-center text-sm font-semibold text-zinc-500 hover:bg-zinc-50"
              >
                초기화
              </Link>
            ) : null}
          </form>
        </section>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900">최신 공고</h3>
          <p className="text-sm text-zinc-500">
            {jobs.pageInfo.total}건
            {hasFilter ? " · 필터 적용" : ""}
          </p>
        </div>

        <JobList
          jobs={jobs.items}
          getHref={(job) => `/jobs/${job.id}`}
          linkComponent={Link}
          renderAction={(job) => (
            <BookmarkButton
              jobPostId={job.id}
              initialBookmarked={bookmarkedIds.has(job.id)}
              variant="icon"
            />
          )}
        />
      </main>
    </div>
  );
}
