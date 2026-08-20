import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountDeletion } from "@/components/account-deletion";
import { AccountSignOut } from "@/components/account-sign-out";
import { AccountSourceLoginClear } from "@/components/account-source-login-clear";
import { MotionReveal } from "@/components/motion-reveal";

export default async function AccountManagePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="page-bg-radial flex min-h-full flex-1 flex-col">
      <div className="mx-auto w-full max-w-lg px-6 py-8">
        <MotionReveal index={0} variant="fade-in">
          <Link
            href="/account"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← 마이페이지
          </Link>
        </MotionReveal>

        <MotionReveal index={1} variant="fade-up" className="mt-6 pb-8">
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">계정 관리</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              로그인 상태와 발링크 계정을 관리합니다.
            </p>
          </header>
        </MotionReveal>

        <MotionReveal index={2} variant="fade-up">
          <section className="border-t border-border py-7">
            <h2 className="text-base font-semibold text-foreground">프로필</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              이름, 이메일, 프로필 사진을 변경합니다.
            </p>
            <Link
              href="/account/profile"
              className="mt-5 inline-flex rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-85"
            >
              프로필 편집
            </Link>
          </section>
        </MotionReveal>
        <MotionReveal index={3} variant="fade-up">
          <AccountSignOut />
        </MotionReveal>
        <MotionReveal index={4} variant="fade-up">
          <AccountSourceLoginClear />
        </MotionReveal>
        <MotionReveal index={5} variant="fade-up">
          <AccountDeletion />
        </MotionReveal>
      </div>
    </main>
  );
}
