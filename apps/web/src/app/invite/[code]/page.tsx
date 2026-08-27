import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { normalizeReferralCode } from "@balink/domain";
import { MotionReveal } from "@/components/motion-reveal";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { RememberInviteRef } from "@/components/remember-invite-ref";
import {
  startInviteAppleAction,
  startInviteKakaoAction,
} from "@/components/referral-actions";
import { CTA_PRESS_CLASS } from "@/lib/button-classes";
import { isAppleLoginEnabled } from "@/lib/auth-features";
import { findInviterByCode } from "@/lib/referral";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = normalizeReferralCode(rawCode);
  if (!code) notFound();

  const inviter = await findInviterByCode(code);
  if (!inviter) notFound();

  const session = await auth();
  const isOwnLink = session?.user?.id === inviter.id;
  const alreadyMember = Boolean(session?.user?.id) && !isOwnLink;
  const inviterName = inviter.name?.trim() || "친구";
  const showApple = isAppleLoginEnabled();

  return (
    <main className="flex min-h-full flex-1 flex-col page-bg-radial">
      <RememberInviteRef code={alreadyMember || isOwnLink ? null : code} />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8">
        <MotionReveal index={0} variant="fade-in">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← 둘러보기
          </Link>
        </MotionReveal>

        <MotionReveal index={1} variant="fade-up" className="mt-6 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isOwnLink ? "내 초대 링크" : `${inviterName}님이 발링크로 불렀어요`}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {isOwnLink
              ? "이 링크를 친구에게 보내 주세요. 친구가 가입하면 관심지역이 하나 더 열리고, 알림 지역을 저장하면 내 관심지역이 무제한이 됩니다."
              : alreadyMember
                ? "이미 발링크 회원입니다. 알림 조건을 두고 공고를 받아 보세요."
                : "조건에 맞는 발레 공고와 대강만 알려 줍니다. 가입하면 관심지역이 하나 더 열립니다."}
          </p>
        </MotionReveal>

        {isOwnLink || alreadyMember ? (
          <MotionReveal index={2} variant="fade-up">
            <Link
              href={alreadyMember ? "/notifications/rules" : "/account/invite"}
              className={`flex h-13 w-full items-center justify-center rounded-2xl bg-accent text-[15px] font-semibold text-background transition hover:opacity-90 ${CTA_PRESS_CLASS}`}
            >
              {alreadyMember ? "알림 조건 보러가기" : "초대 링크 보내기"}
            </Link>
          </MotionReveal>
        ) : (
          <MotionReveal index={2} variant="fade-up" className="space-y-3">
            <form action={startInviteKakaoAction.bind(null, code)}>
              <PendingSubmitButton
                pendingLabel="연결 중..."
                className={`flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#FEE500] text-[15px] font-semibold text-[#191600] transition hover:brightness-95 disabled:opacity-50 ${CTA_PRESS_CLASS}`}
              >
                카카오로 시작하기
              </PendingSubmitButton>
            </form>
            {showApple ? (
              <form action={startInviteAppleAction.bind(null, code)}>
                <PendingSubmitButton
                  pendingLabel="연결 중..."
                  className={`flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl bg-foreground text-[15px] font-semibold text-background transition hover:opacity-90 disabled:opacity-50 ${CTA_PRESS_CLASS}`}
                >
                  Apple로 시작하기
                </PendingSubmitButton>
              </form>
            ) : null}
            <Link
              href={`/signup?ref=${encodeURIComponent(code)}`}
              className={`flex h-13 w-full items-center justify-center rounded-2xl border border-border bg-surface text-[15px] font-semibold text-foreground transition hover:bg-surface-muted ${CTA_PRESS_CLASS}`}
            >
              이메일로 가입하기
            </Link>
          </MotionReveal>
        )}
      </div>
    </main>
  );
}
