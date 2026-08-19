import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { AccountDeletion } from "@/components/account-deletion";
import { LoginScreen } from "@/components/login-screen";
import { MobileAwareSignOutForm } from "@/components/mobile-aware-sign-out-form";
import { OriginalSourceLink } from "@/components/original-source-link";
import { ThemeSelector } from "@/components/theme-selector";
import { DEFAULT_AVATAR_PATH } from "@/lib/profile-image";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    // Same tab root — no stack push. Show the real login UI immediately.
    return <LoginScreen showBrowseLink={false} />;
  }

  const user = session.user;

  return (
    <main className="page-bg-radial flex min-h-full flex-1 flex-col">
      <div className="mx-auto w-full max-w-lg px-6 py-8">
        <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h1 className="text-xl font-bold tracking-tight text-foreground">내 계정</h1>
          <p className="mt-1 text-sm text-muted-foreground">프로필과 바로가기</p>

          <div className="mt-6 flex items-center gap-3">
            <Image
              src={user.image || DEFAULT_AVATAR_PATH}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
              unoptimized
            />
            <div>
              <p className="font-semibold text-foreground">{user.name ?? "회원"}</p>
              <p className="text-sm text-muted-foreground">{user.email ?? "이메일 없음"}</p>
            </div>
          </div>
        </section>

        <ThemeSelector />

        <section className="mt-4 space-y-3 rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">바로가기</h2>
          <Link
            href="/notifications"
            className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:border-accent-border hover:text-accent"
          >
            알림함
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/notifications/rules"
            className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:border-accent-border hover:text-accent"
          >
            알림 조건 설정
            <span aria-hidden>→</span>
          </Link>
        </section>

        <section className="mt-4 space-y-3 rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">약관 및 정책</h2>
          <Link
            href="/terms"
            className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:border-accent-border hover:text-accent"
          >
            이용약관
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/privacy"
            className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:border-accent-border hover:text-accent"
          >
            개인정보처리방침
            <span aria-hidden>→</span>
          </Link>
        </section>

        <section className="mt-4 space-y-3 rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">고객지원 및 계정</h2>
          <OriginalSourceLink
            href="https://forms.gle/a4souo2Cz6bDb3BA8"
            embedHref="https://docs.google.com/forms/d/e/1FAIpQLSecIVjSi1jOypLKZyIn8h4WuJGk28nG_nFulo97iNcbk5o6Eg/viewform?embedded=true"
            title="발링크 문의"
            className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:border-accent-border hover:text-accent"
          >
            문의하기
            <span aria-hidden>→</span>
          </OriginalSourceLink>
          <MobileAwareSignOutForm
            buttonClassName="flex w-full items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:border-accent-border hover:text-accent"
          />
        </section>

        <AccountDeletion />
      </div>
    </main>
  );
}
