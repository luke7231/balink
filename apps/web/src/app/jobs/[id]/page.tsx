import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchJobPost } from "@/lib/graphql/queries";
import {
  formatJobType,
  formatLocation,
  formatPay,
  formatPostedAt,
  formatSource,
  formatTimeSlot,
} from "@/lib/format";

export const dynamic = "force-dynamic";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const job = await fetchJobPost(id);

  if (!job) notFound();

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-5">
          <Link href="/" className="text-sm font-medium text-rose-600 hover:text-rose-700">
            ← 목록으로
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
              {formatJobType(job.jobType)}
            </span>
            {job.timeSlots.map((slot) => (
              <span key={slot} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">
                {formatTimeSlot(slot)}
              </span>
            ))}
          </div>

          <h1 className="text-2xl font-bold leading-tight text-zinc-900">{job.title}</h1>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">지역</dt>
              <dd className="mt-1 font-medium text-zinc-900">
                {formatLocation(job.sido, job.sigungu, job.locationText)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">게시일</dt>
              <dd className="mt-1 font-medium text-zinc-900">{formatPostedAt(job.postedAt)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">요일</dt>
              <dd className="mt-1 font-medium text-zinc-900">{job.days.length ? job.days.join(", ") : "미상"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">급여</dt>
              <dd className="mt-1 font-medium text-zinc-900">
                {formatPay(job.payText, job.payMinManwon, job.payMaxManwon)}
              </dd>
            </div>
          </dl>

          {job.description ? (
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-zinc-900">공고 내용</h2>
              <p className="mt-3 whitespace-pre-wrap leading-7 text-zinc-700">{job.description}</p>
            </section>
          ) : null}

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
