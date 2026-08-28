"use client";

import { useState, useTransition } from "react";
import { MotionReveal } from "@/components/motion-reveal";
import { FormError } from "@/components/form-error";
import {
  ButtonPendingContent,
  PendingSubmitButton,
} from "@/components/pending-submit-button";
import { claimInviteCodeAction, skipInviteClaimAction } from "@/components/referral-actions";
import { CTA_PRESS_CLASS } from "@/lib/button-classes";
import type { InviteClaimFrom } from "@/lib/referral";

const inputClass =
  "h-12 w-full rounded-2xl border border-border bg-background px-4 text-center text-lg font-semibold tracking-[0.2em] text-foreground uppercase outline-none focus:border-accent";

const primaryBtnClass = `flex h-13 w-full items-center justify-center rounded-2xl bg-accent text-[15px] font-semibold text-background transition hover:opacity-90 disabled:opacity-50 ${CTA_PRESS_CLASS}`;
const secondaryBtnClass = `flex h-13 w-full items-center justify-center rounded-2xl border border-border bg-surface text-[15px] font-semibold text-foreground transition hover:bg-surface-muted disabled:opacity-50 ${CTA_PRESS_CLASS}`;

export function InviteCodeClaimForm({ from = "signup" }: { from?: InviteClaimFrom }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const skipLabel =
    from === "account"
      ? "마이페이지로 돌아가기"
      : from === "limit"
        ? "관심지역으로 돌아가기"
        : "건너뛰고 시작하기";

  return (
    <div className="space-y-3">
      <MotionReveal index={2} variant="fade-up">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            startTransition(async () => {
              const result = await claimInviteCodeAction(code, from);
              if (result && !result.ok) setError(result.error);
            });
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">친구 코드</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={12}
              placeholder="예: W635TLBB"
              disabled={pending}
              className={inputClass}
            />
          </label>
          {error ? <FormError>{error}</FormError> : null}
          <button
            type="submit"
            disabled={pending || code.trim().length < 8}
            aria-busy={pending || undefined}
            className={primaryBtnClass}
          >
            <ButtonPendingContent pending={pending} pendingLabel="등록하는 중...">
              코드 등록하기
            </ButtonPendingContent>
          </button>
        </form>
      </MotionReveal>

      <MotionReveal index={3} variant="fade-up">
        <form action={skipInviteClaimAction.bind(null, from)}>
          <PendingSubmitButton
            pendingLabel="건너뛰는 중..."
            forceDisabled={pending}
            className={secondaryBtnClass}
          >
            {skipLabel}
          </PendingSubmitButton>
        </form>
      </MotionReveal>
    </div>
  );
}
