import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EmailLoginForm } from "@/components/email-login-form";
import { MotionReveal } from "@/components/motion-reveal";
import { isEmailAuthEnabled } from "@/lib/auth-features";

export default async function EmailLoginPage() {
  if (!isEmailAuthEnabled()) redirect("/login");
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-full flex-1 flex-col page-bg-radial">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8">
        <MotionReveal index={0} variant="fade-in">
          <Link
            href="/login"
            className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← 로그인
          </Link>
        </MotionReveal>

        <MotionReveal index={1} variant="fade-up" className="mt-6 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">이메일 로그인</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            인증된 이메일과 비밀번호로 로그인합니다.
          </p>
        </MotionReveal>

        <EmailLoginForm />
      </div>
    </main>
  );
}
