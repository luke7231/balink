import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatLocation,
  formatOrganizationType,
} from "@balink/domain";
import { Badge } from "@balink/ui/badge";
import { JobCard } from "@balink/ui/job-card";
import { AcademyGallery } from "@/components/academy-gallery";
import { fetchOrganization } from "@/lib/graphql/queries";

export const dynamic = "force-dynamic";

interface OrganizationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizationDetailPage({ params }: OrganizationDetailPageProps) {
  const { id } = await params;
  const organization = await fetchOrganization(id);

  if (!organization) notFound();

  return (
    <div className="min-h-full bg-surface-muted">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-5">
          <Link href="/" className="text-sm font-medium text-accent hover:text-accent">
            ← 목록으로
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="rose">{formatOrganizationType(organization.type)}</Badge>
            <Badge>{organization.jobPostCount}개 공고</Badge>
          </div>

          <div className="flex items-start gap-4">
            {organization.logoUrl ? (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface-muted p-2">
                <img
                  src={organization.logoUrl}
                  alt={`${organization.name} 로고`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : null}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight text-foreground">{organization.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatLocation(
                  organization.sido ?? null,
                  organization.sigungu ?? null,
                  organization.dongOrStation ?? null,
                )}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            {organization.phones.length > 0 ? (
              <div>
                <dt className="text-muted-foreground">전화</dt>
                <dd className="mt-1 space-y-1 font-medium text-foreground">
                  {organization.phones.map((phone) => (
                    <a key={phone} href={`tel:${phone}`} className="block hover:text-accent">
                      {phone}
                    </a>
                  ))}
                </dd>
              </div>
            ) : null}
            {organization.emails.length > 0 ? (
              <div>
                <dt className="text-muted-foreground">이메일</dt>
                <dd className="mt-1 space-y-1 font-medium text-foreground">
                  {organization.emails.map((email) => (
                    <a key={email} href={`mailto:${email}`} className="block hover:text-accent">
                      {email}
                    </a>
                  ))}
                </dd>
              </div>
            ) : null}
            {organization.externalProfileUrl ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">외부 프로필</dt>
                <dd className="mt-1">
                  <a
                    href={organization.externalProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent hover:underline"
                  >
                    원본 기업정보 보기
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>

          <AcademyGallery logoUrl={null} gallery={organization.gallery} />

          <section className="mt-8">
            <h2 className="text-sm font-semibold text-foreground">채용 공고</h2>
            {organization.jobPosts.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">연결된 공고가 없습니다.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {organization.jobPosts.map((job) => (
                  <JobCard key={job.id} job={job} href={`/jobs/${job.id}`} linkComponent={Link} />
                ))}
              </div>
            )}
          </section>
        </article>
      </main>
    </div>
  );
}
