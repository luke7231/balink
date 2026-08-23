import Link from "next/link";
import { auth } from "@/auth";
import { AccountInviteCode } from "@/components/account-invite-code";
import { LoginScreen } from "@/components/login-screen";
import { ProfileAvatar } from "@/components/profile-avatar";
import { SupportInquirySheet } from "@/components/support-inquiry-sheet";
import { ThemeSelector } from "@/components/theme-selector";
import { getOrCreateReferralCode, loadRegionLimitState } from "@/lib/referral";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    // Same tab root — no stack push. Show the real login UI immediately.
    return <LoginScreen showBrowseLink={false} />;
  }

  const user = session.user;
  const [inviteCode, regionLimit] = await Promise.all([
    getOrCreateReferralCode(session.user.id),
    loadRegionLimitState(session.user.id),
  ]);

  return (
    <main className="page-bg-radial flex min-h-full flex-1 flex-col">
      <div className="mx-auto w-full max-w-lg px-6 py-8">
        <section className="pb-8">
          <h1 className="text-xl font-bold tracking-tight text-foreground">내 계정</h1>
          <p className="mt-1 text-sm text-muted-foreground">프로필과 바로가기</p>

          <Link
            href="/account/profile"
            className="mt-6 flex items-center gap-3 rounded-2xl outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ProfileAvatar
              src={user.image}
              size={48}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{user.name ?? "회원"}</p>
              <p className="text-sm text-muted-foreground">{user.email ?? "이메일 없음"}</p>
            </div>
            <span className="text-sm font-semibold text-accent">편집</span>
          </Link>
          <AccountInviteCode code={inviteCode} />
        </section>

        <ThemeSelector />

        <section className="border-t border-border py-7">
          <h2 className="text-base font-semibold text-foreground">바로가기</h2>
          <div className="mt-3">
            <Link
              href="/notifications"
              className="-mx-2 flex items-center justify-between px-2 py-3 text-sm font-semibold text-foreground hover:text-accent"
            >
              알림함
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/notifications/rules"
              className="-mx-2 flex items-center justify-between px-2 py-3 text-sm font-semibold text-foreground hover:text-accent"
            >
              알림 조건 설정
              <span aria-hidden>→</span>
            </Link>
            {regionLimit.referred ? null : (
              <Link
                href="/signup/invite-code?from=account"
                className="-mx-2 flex items-center justify-between px-2 py-3 text-sm font-semibold text-foreground hover:text-accent"
              >
                친구 코드 입력하기
                <span aria-hidden>→</span>
              </Link>
            )}
            <Link
              href="/account/invite"
              className="-mx-2 flex items-center justify-between px-2 py-3 text-sm font-semibold text-foreground hover:text-accent"
            >
              관심지역 무제한 열기
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        <section className="border-t border-border py-7">
          <h2 className="text-base font-semibold text-foreground">약관 및 정책</h2>
          <div className="mt-3">
            <Link
              href="/terms"
              className="-mx-2 flex items-center justify-between px-2 py-3 text-sm font-semibold text-foreground hover:text-accent"
            >
              이용약관
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/privacy"
              className="-mx-2 flex items-center justify-between px-2 py-3 text-sm font-semibold text-foreground hover:text-accent"
            >
              개인정보처리방침
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        <section className="border-t border-border py-7">
          <h2 className="text-base font-semibold text-foreground">고객지원</h2>
          <div className="mt-3">
            <SupportInquirySheet
              javascriptKey={process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim()}
              channelPublicId={process.env.NEXT_PUBLIC_KAKAO_CHANNEL_PUBLIC_ID?.trim()}
            />
          </div>
        </section>

        <section className="border-t border-border py-7">
          <h2 className="text-base font-semibold text-foreground">계정</h2>
          <div className="mt-3">
            <Link
              href="/account/manage"
              className="-mx-2 flex items-center justify-between px-2 py-3 text-sm font-semibold text-foreground hover:text-accent"
            >
              계정 관리
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
