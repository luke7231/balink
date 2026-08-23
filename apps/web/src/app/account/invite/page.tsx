import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BackLink } from "@/components/back-link";
import { InviteSharePanel } from "@/components/invite-share-panel";
import { MotionReveal } from "@/components/motion-reveal";
import { getOrCreateReferralCode, loadRegionLimitState } from "@/lib/referral";

export const dynamic = "force-dynamic";

export default async function AccountInvitePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [code, regionLimit] = await Promise.all([
    getOrCreateReferralCode(session.user.id),
    loadRegionLimitState(session.user.id),
  ]);

  return (
    <main className="page-bg-radial flex min-h-full flex-1 flex-col">
      <div className="mx-auto w-full max-w-lg px-6 py-8">
        <MotionReveal index={0} variant="fade-in">
          <BackLink
            href="/account"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← 마이페이지
          </BackLink>
        </MotionReveal>

        <MotionReveal index={1} variant="fade-up" className="mt-6 pb-8">
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {regionLimit.unlocked ? "친구 초대하기" : "관심지역 무제한 열기"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {regionLimit.unlocked
                ? "관심지역은 이미 열려 있습니다. 친구에게 발링크를 알려 주세요."
                : regionLimit.referred
                  ? "친구가 알림 조건을 저장하면 무제한으로 열립니다."
                  : "기본은 한 곳입니다. 코드를 넣으면 하나 더, 친구 한 명을 초대하면 무제한입니다."}
            </p>
          </header>
        </MotionReveal>

        {!regionLimit.unlocked && !regionLimit.referred ? (
          <MotionReveal index={2} variant="fade-up">
            <Link
              href="/signup/invite-code?from=limit"
              className="flex h-12 w-full items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-foreground hover:bg-surface-muted"
            >
              친구 코드 입력하기
            </Link>
          </MotionReveal>
        ) : null}

        <MotionReveal index={regionLimit.unlocked || regionLimit.referred ? 2 : 3} variant="fade-up">
          <InviteSharePanel
            code={code}
            unlocked={regionLimit.unlocked}
            referred={regionLimit.referred}
          />
        </MotionReveal>
      </div>
    </main>
  );
}
