import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { deleteAccountAction } from "@/components/account-actions";
import { LoginScreen } from "@/components/login-screen";
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

        <section className="mt-4 rounded-3xl border border-accent-border bg-accent-subtle p-6">
          <h2 className="text-base font-semibold text-accent">계정 삭제</h2>
          <p className="mt-2 text-sm leading-relaxed text-accent">
            발링크 회원 정보가 삭제되고, 카카오 연결도 해제(unlink)를 시도합니다.
            삭제 후에는 같은 카카오로 다시 가입할 수 있습니다.
          </p>

          <form action={deleteAccountAction} className="mt-5">
            <button
              type="submit"
              className="rounded-full bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800"
            >
              계정 삭제하기
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
