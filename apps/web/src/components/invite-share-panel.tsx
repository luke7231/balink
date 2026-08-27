"use client";

import { useState, useTransition } from "react";
import { FormError } from "@/components/form-error";
import { CTA_PRESS_CLASS } from "@/lib/button-classes";
import { inviteShareText } from "@/lib/invite-share";

export function InviteSharePanel({
  code,
  unlocked,
}: {
  code: string;
  unlocked: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function sendInvite() {
    setError(null);
    startTransition(async () => {
      const text = inviteShareText(code);
      try {
        if (navigator.share) {
          await navigator.share({ title: "발링크", text });
          return;
        }
        await navigator.clipboard.writeText(text);
        setCopied(true);
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === "AbortError") return;
        setError("초대 코드를 보내지 못했어요. 복사로 보내 주세요.");
      }
    });
  }

  function copyCode() {
    setError(null);
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
      } catch {
        setError("코드를 복사하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    });
  }

  return (
    <section className="border-t border-border py-7">
      <h2 className="text-base font-semibold text-foreground">친구 코드</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {unlocked
          ? "친구가 가입한 뒤 이 코드를 넣으면 그 친구의 관심지역이 하나 더 열립니다."
          : "친구가 가입한 뒤 이 코드를 넣으면 내 관심지역이 무제한이 됩니다."}
      </p>
      <div className="mt-4 flex items-center justify-center gap-1 rounded-2xl bg-surface-muted px-3 py-2">
        <p className="text-lg font-semibold tracking-[0.2em] text-foreground">{code}</p>
        <button
          type="button"
          disabled={pending}
          onClick={copyCode}
          aria-label="친구 코드 복사"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-50"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
      <div className="mt-5">
        <button
          type="button"
          disabled={pending}
          onClick={sendInvite}
          className={`flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50 ${CTA_PRESS_CLASS}`}
        >
          친구 코드 보내기
        </button>
      </div>
      {error ? <FormError className="mt-3 text-sm text-accent">{error}</FormError> : null}
    </section>
  );
}

function CopyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect
        x="7"
        y="7"
        width="8"
        height="9"
        rx="1.6"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M5.2 11.2H4.4A1.6 1.6 0 0 1 2.8 9.6V4.4A1.6 1.6 0 0 1 4.4 2.8h5.2A1.6 1.6 0 0 1 11.2 4.4v.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M4 9.2 7.2 12.4 14 5.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
