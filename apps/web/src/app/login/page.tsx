import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, isAppleLoginEnabled } from "@/auth";
import { signInWithApple, signInWithKakao } from "@/components/login-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  const errorMessage = params.error
    ? "로그인에 실패했습니다. 다시 시도해 주세요."
    : null;
  const deletedMessage = params.deleted ? "계정이 삭제되었습니다." : null;

  return (
    <main className="flex min-h-full flex-1 flex-col bg-[radial-gradient(circle_at_top,#fff9fa,#ffffff_42%)]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"
        >
          ← 둘러보기
        </Link>

        <div className="flex flex-1 flex-col items-center justify-center gap-8 pb-10">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-950 text-white">
              <SwanMark />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-rose-600">Black Swan</p>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                흩어진 발레 공고를
                <br />
                한곳에서
              </h1>
              <p className="text-sm text-zinc-500">
                카카오 또는 Apple로 시작하고 관심 공고를 받아보세요.
              </p>
            </div>
          </div>

          {deletedMessage ? (
            <p className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {deletedMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex w-full flex-col gap-3">
            <form action={signInWithKakao}>
              <button
                type="submit"
                className="flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#FEE500] text-[15px] font-semibold text-[#191600] transition hover:brightness-95"
              >
                <KakaoIcon />
                카카오로 계속하기
              </button>
            </form>

            {isAppleLoginEnabled ? (
              <form action={signInWithApple}>
                <button
                  type="submit"
                  className="flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl bg-zinc-950 text-[15px] font-semibold text-white transition hover:bg-zinc-800"
                >
                  <AppleIcon />
                  Apple로 계속하기
                </button>
              </form>
            ) : (
              <p className="px-1 text-center text-xs text-zinc-400">
                Apple 로그인은 설정 후 활성화됩니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function SwanMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 38 38" fill="none" aria-hidden>
      <ellipse cx="20" cy="26" rx="9" ry="6" fill="white" opacity="0.95" />
      <path
        d="M18 26 Q16 20 15 14 Q14.5 10 17 9 Q19.5 8 20 11 Q20.5 14 19 18 Q18.2 21 18 26Z"
        fill="white"
        opacity="0.95"
      />
      <ellipse cx="17.5" cy="8.5" rx="3" ry="2.5" fill="white" />
      <path d="M14.5 8.5 L12 8 L14 9 Z" fill="white" opacity="0.7" />
      <path d="M22 23 Q28 18 30 20 Q28 24 22 26Z" fill="white" opacity="0.7" />
    </svg>
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
