"use client";

import { useState, useTransition } from "react";
import { MotionReveal } from "@/components/motion-reveal";
import { claimInviteCodeAction, skipInviteClaimAction } from "@/components/referral-actions";
import type { InviteClaimFrom } from "@/lib/referral";

const inputClass =
  "h-12 w-full rounded-2xl border border-border bg-background px-4 text-center text-lg font-semibold tracking-[0.2em] text-foreground uppercase outline-none focus:border-accent";

export function InviteCodeClaimForm({ from = "signup" }: { from?: InviteClaimFrom }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
              className={inputClass}
            />
          </label>
          {error ? <p className="text-sm text-accent">{error}</p> : null}
          <button
            type="submit"
            disabled={pending || code.trim().length < 8}
            className="flex h-13 w-full items-center justify-center rounded-2xl bg-accent text-[15px] font-semibold text-background transition hover:opacity-90 active:scale-[0.985] disabled:opacity-50"
          >
            {pending ? "등록하는 중..." : "코드 등록하기"}
          </button>
        </form>
      </MotionReveal>

      <MotionReveal index={3} variant="fade-up">
        <form action={skipInviteClaimAction.bind(null, from)}>
          <button
            type="submit"
            disabled={pending}
            className="flex h-13 w-full items-center justify-center rounded-2xl border border-border bg-surface text-[15px] font-semibold text-foreground transition hover:bg-surface-muted disabled:opacity-50"
          >
            {from === "account"
              ? "마이페이지로 돌아가기"
              : from === "limit"
                ? "알림 조건으로 돌아가기"
                : "건너뛰고 시작하기"}
          </button>
        </form>
      </MotionReveal>
    </div>
  );
}
