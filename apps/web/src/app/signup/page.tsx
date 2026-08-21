import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MotionReveal } from "@/components/motion-reveal";
import { SignupForm } from "@/components/signup-form";

export default async function SignupPage() {
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">회원가입</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            이메일 인증 후에만 계정이 만들어집니다.
          </p>
        </MotionReveal>

        <SignupForm />

        <p className="mt-auto px-4 pb-2 pt-8 text-center text-[11px] leading-4 text-muted-foreground">
          계속하면 발링크의{" "}
          <Link href="/terms" className="font-medium text-foreground/80 underline underline-offset-2">
            이용약관
          </Link>
          과{" "}
          <Link href="/privacy" className="font-medium text-foreground/80 underline underline-offset-2">
            개인정보처리방침
          </Link>
          에 동의합니다.
        </p>
      </div>
    </main>
  );
}
