"use client";

import { useState, useTransition } from "react";

export function AccountInviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function copyCode() {
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
      } catch {
        setCopied(false);
      }
    });
  }

  return (
    <div className="mt-2 flex items-center gap-1 pl-[3.75rem]">
      <p className="text-sm text-muted-foreground">
        친구 코드{" "}
        <span className="font-semibold tracking-wider text-foreground">{code}</span>
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={copyCode}
        aria-label="친구 코드 복사"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
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
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
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
