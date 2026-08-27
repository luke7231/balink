import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MotionReveal } from "@/components/motion-reveal";
import { PasswordResetForm } from "@/components/password-reset-form";

export default async function PasswordResetPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-full flex-1 flex-col page-bg-radial">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8">
        <MotionReveal index={0} variant="fade-in">
          <Link
            href="/login/email"
            className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← 이메일 로그인
          </Link>
        </MotionReveal>

        <MotionReveal index={1} variant="fade-up" className="mt-6 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">비밀번호 재설정</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            이메일 인증 후 새 비밀번호를 설정합니다.
          </p>
        </MotionReveal>

        <PasswordResetForm />
      </div>
    </main>
  );
}
