import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatLessonDates,
  formatLocation,
  formatPostedAt,
  formatSubstituteStatus,
  formatSubstituteUrgency,
} from "@black-swan/domain";
import { Badge } from "@black-swan/ui/badge";
import { fetchSubstitutePost } from "@/lib/graphql/queries";

export const dynamic = "force-dynamic";

interface SubstituteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SubstituteDetailPage({ params }: SubstituteDetailPageProps) {
  const { id } = await params;
  const post = await fetchSubstitutePost(id);

  if (!post) notFound();

  const urgencyLabel = formatSubstituteUrgency(post.urgency ?? null);
  const timeLabel =
    post.timeSlots
      .map((slot) => slot.raw || [slot.start, slot.end].filter(Boolean).join("~"))
      .filter(Boolean)
      .join(", ") || "시간 미상";

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-5">
          <Link href="/substitutes" className="text-sm font-medium text-rose-600 hover:text-rose-700">
            ← 대타 게시판
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            {urgencyLabel ? <Badge variant="rose">{urgencyLabel}</Badge> : null}
            <Badge>{formatSubstituteStatus(post.status)}</Badge>
          </div>

          <h1 className="text-2xl font-bold leading-tight text-zinc-900">{post.title}</h1>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">작성자</dt>
              <dd className="mt-1 font-medium text-zinc-900">{post.author || "미상"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">게시일</dt>
              <dd className="mt-1 font-medium text-zinc-900">{formatPostedAt(post.postedAt ?? null)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">지역</dt>
              <dd className="mt-1 font-medium text-zinc-900">
                {post.locationText ||
                  formatLocation(post.sido ?? null, post.sigungu ?? null, post.dongOrStation ?? null)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">수업일</dt>
              <dd className="mt-1 font-medium text-zinc-900">{formatLessonDates(post.lessonDates)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">시간</dt>
              <dd className="mt-1 font-medium text-zinc-900">{timeLabel}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">급여</dt>
              <dd className="mt-1 font-medium text-zinc-900">{post.payText || "협의"}</dd>
            </div>
          </dl>

          {post.body ? (
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-zinc-900">원문</h2>
              <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
                {post.body}
              </pre>
            </section>
          ) : null}

          {(post.contactPhones.length > 0 || post.contactEmails.length > 0) && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-zinc-900">연락처</h2>
              <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                {post.contactPhones.map((phone) => (
                  <li key={phone}>{phone}</li>
                ))}
                {post.contactEmails.map((email) => (
                  <li key={email}>{email}</li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-8">
            <a
              href={post.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
            >
              발레매니아 원문 보기
            </a>
          </div>
        </article>
      </main>
    </div>
  );
}
