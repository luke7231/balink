"use client";

import Link from "next/link";
import { skipInviteClaimAction } from "@/components/referral-actions";
import { MotionReveal } from "@/components/motion-reveal";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { AuthBoundarySync } from "@/lib/auth-boundary-client";
import { CTA_PRESS_CLASS } from "@/lib/button-classes";

/** Post-signup completion: invite CTA + skip. AuthBoundarySync refreshes other tabs. */
export function SignupWelcomeActions() {
  return (
    <>
      <AuthBoundarySync />
      <div className="mt-10 flex w-full flex-col gap-3">
        <MotionReveal index={2} variant="fade-up">
          <Link
            href="/signup/invite-code"
            className={`flex h-13 w-full items-center justify-center rounded-2xl bg-accent text-[15px] font-semibold text-background transition hover:opacity-90 ${CTA_PRESS_CLASS}`}
          >
            친구 코드 입력하기
          </Link>
        </MotionReveal>

        <MotionReveal index={3} variant="fade-up">
          <form action={skipInviteClaimAction.bind(null, "signup")}>
            <PendingSubmitButton
              pendingLabel="건너뛰는 중..."
              className={`flex h-13 w-full items-center justify-center rounded-2xl border border-border bg-surface text-[15px] font-semibold text-foreground transition hover:bg-surface-muted disabled:opacity-50 ${CTA_PRESS_CLASS}`}
            >
              건너뛰기
            </PendingSubmitButton>
          </form>
        </MotionReveal>
      </div>
    </>
  );
}
