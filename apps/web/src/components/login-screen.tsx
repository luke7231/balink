import Image from "next/image";
import Link from "next/link";
import { isAppleLoginEnabled } from "@/auth";
import { signInWithApple, signInWithKakao } from "@/components/login-actions";
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
              width={1024}
              height={341}
              priority
              className="h-10 w-auto dark:hidden"
            />
            <Image
              src="/brand/logo-horizontal-dark.png"
              alt="balink"
              width={1024}
              height={341}
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
              <button
                type="submit"
                className="flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#FEE500] text-[15px] font-semibold text-[#191600] transition hover:brightness-95 active:scale-[0.985]"
              >
                <KakaoIcon />
                카카오로 계속하기
              </button>
            </form>

            {isAppleLoginEnabled ? (
              <form action={signInWithApple} className="motion-fade-up" style={motionIndexStyle(4)}>
                <button
                  type="submit"
                  className="flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl bg-foreground text-[15px] font-semibold text-background transition hover:opacity-90 active:scale-[0.985]"
                >
                  <AppleIcon />
                  Apple로 계속하기
                </button>
              </form>
            ) : (
              <p
                className="motion-fade-in px-1 text-center text-xs text-muted-foreground"
                style={motionIndexStyle(4)}
              >
                Apple 로그인은 설정 후 활성화됩니다.
              </p>
            )}

            <p
              className="motion-fade-in px-4 pt-1 text-center text-xs leading-5 text-muted-foreground"
              style={motionIndexStyle(5)}
            >
              계속하면 발링크의{" "}
              <Link href="/terms" className="font-medium text-foreground underline underline-offset-2">
                이용약관
              </Link>
              과{" "}
              <Link
                href="/privacy"
                className="font-medium text-foreground underline underline-offset-2"
              >
                개인정보처리방침
              </Link>
              에 동의하는 것으로 봅니다.
            </p>
          </div>
        </div>
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

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M12.7 9.3c0-1.8 1.5-2.7 1.5-2.7-.8-1.2-2.1-1.4-2.6-1.4-1.1-.1-2.2.7-2.7.7-.6 0-1.5-.6-2.4-.6-1.2 0-2.4.7-3 1.9-1.3 2.2-.3 5.5.9 7.3.6.9 1.3 1.9 2.2 1.8.9 0 1.2-.6 2.3-.6s1.4.6 2.4.5c1 0 1.6-.9 2.2-1.8.7-1 1-2 1-2.1-.1 0-1.9-.7-1.8-2.9ZM11.1 3.8c.5-.6.8-1.4.7-2.2-.7 0-1.6.5-2.1 1.1-.5.5-.9 1.4-.8 2.2.8.1 1.6-.4 2.2-1.1Z"
        fill="white"
      />
    </svg>
  );
}
