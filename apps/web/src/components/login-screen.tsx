import Image from "next/image";
import Link from "next/link";
import { signInWithKakao } from "@/components/login-actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { CTA_PRESS_CLASS } from "@/lib/button-classes";
import { motionIndexStyle } from "@/lib/motion";

export function LoginScreen({
  showBrowseLink = true,
  errorMessage = null,
  deletedMessage = null,
}: {
  showBrowseLink?: boolean;
  errorMessage?: string | null;
  deletedMessage?: string | null;
}) {
  return (
    <main className="flex min-h-full flex-1 flex-col page-bg-radial">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8">
        {showBrowseLink ? (
          <Link
            href="/"
            className="motion-fade-in inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            style={motionIndexStyle(0)}
          >
            ← 둘러보기
          </Link>
        ) : (
          <div className="h-5" aria-hidden="true" />
        )}

        <div className="flex flex-1 flex-col items-center justify-center gap-8 pb-10">
          <div
            className="motion-soft-scale flex flex-col items-center gap-5 text-center"
            style={motionIndexStyle(1)}
          >
            <Image
              src="/brand/logo-horizontal.png"
              alt="balink"
              width={614}
              height={175}
              priority
              className="h-10 w-auto dark:hidden"
            />
            <Image
              src="/brand/logo-horizontal-dark.png"
              alt="balink"
              width={611}
              height={169}
              priority
              className="hidden h-10 w-auto dark:block"
            />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              발레 커리어의 시작
            </h1>
          </div>

          {deletedMessage ? (
            <p
              className="motion-fade-up w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              style={motionIndexStyle(2)}
            >
              {deletedMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p
              className="motion-fade-up w-full rounded-xl border border-accent-border bg-accent-subtle px-4 py-3 text-sm text-accent"
              style={motionIndexStyle(2)}
            >
              {errorMessage}
            </p>
          ) : null}

          <div className="flex w-full flex-col gap-3" style={motionIndexStyle(3)}>
            <form action={signInWithKakao} className="motion-fade-up" style={motionIndexStyle(3)}>
              <PendingSubmitButton
                pendingLabel="연결 중..."
                className={`flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#FEE500] text-[15px] font-semibold text-[#191600] transition hover:brightness-95 disabled:opacity-50 ${CTA_PRESS_CLASS}`}
              >
                <KakaoIcon />
                카카오로 계속하기
              </PendingSubmitButton>
            </form>

            <div
              className="motion-fade-up relative my-1 flex items-center gap-3"
              style={motionIndexStyle(4)}
              aria-hidden
            >
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">또는</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Link
              href="/login/email"
              className={`motion-fade-up flex h-13 w-full items-center justify-center rounded-2xl border border-border bg-surface text-[15px] font-semibold text-foreground transition hover:bg-surface-muted ${CTA_PRESS_CLASS}`}
              style={motionIndexStyle(5)}
            >
              이메일로 로그인
            </Link>

            <p
              className="motion-fade-in px-1 pt-1 text-center text-sm text-muted-foreground"
              style={motionIndexStyle(6)}
            >
              계정이 없다면{" "}
              <Link href="/signup" className="font-medium text-foreground underline underline-offset-2">
                회원가입
              </Link>
            </p>
          </div>
        </div>

        <p
          className="motion-fade-in mt-auto px-4 pb-2 pt-6 text-center text-[11px] leading-4 text-muted-foreground"
          style={motionIndexStyle(7)}
        >
          계속하면 발링크의{" "}
          <Link href="/terms" className="font-medium text-foreground/80 underline underline-offset-2">
            이용약관
          </Link>
          과{" "}
          <Link
            href="/privacy"
            className="font-medium text-foreground/80 underline underline-offset-2"
          >
            개인정보처리방침
          </Link>
          에 동의합니다.
        </p>
      </div>
    </main>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M9 1.5C4.86 1.5 1.5 4.16 1.5 7.45c0 2.12 1.4 3.98 3.52 5.05l-.9 3.3c-.08.3.26.53.5.37l3.95-2.62c.47.05.96.08 1.43.08 4.14 0 7.5-2.66 7.5-5.95S13.14 1.5 9 1.5Z"
        fill="#191600"
      />
    </svg>
  );
}
