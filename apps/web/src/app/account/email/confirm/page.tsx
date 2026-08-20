import Link from "next/link";
import { MotionReveal } from "@/components/motion-reveal";
import { confirmEmailChangeWithToken } from "@/components/profile-actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ token?: string }>;

export default async function EmailConfirmPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const result = token
    ? await confirmEmailChangeWithToken(token)
    : { ok: false as const, error: "유효하지 않은 링크입니다." };

  return (
    <main className="page-bg-radial flex min-h-full flex-1 flex-col">
      <div className="mx-auto w-full max-w-lg px-6 py-8">
        <MotionReveal index={0} variant="fade-in">
          <Link
            href="/account/profile"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← 프로필 편집
          </Link>
        </MotionReveal>

        <MotionReveal index={1} variant="fade-up" className="mt-6">
          <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {result.ok ? "이메일 변경 완료" : "이메일 변경 실패"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {result.ok ? result.message : result.error}
            </p>
            <Link
              href={result.ok ? "/account" : "/account/profile"}
              className="mt-6 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-85"
            >
              {result.ok ? "마이페이지로" : "다시 요청하기"}
            </Link>
          </section>
        </MotionReveal>
      </div>
    </main>
  );
}
