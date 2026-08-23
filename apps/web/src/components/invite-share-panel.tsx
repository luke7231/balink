"use client";

import { useEffect, useState, useTransition } from "react";
import { inviteShareText } from "@/lib/invite-share";

export function InviteSharePanel({
  code,
  unlocked,
  referred = false,
}: {
  code: string;
  unlocked: boolean;
  referred?: boolean;
}) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkText, setLinkText] = useState(`/invite/${code}`);
  const [pending, startTransition] = useTransition();
  const path = `/invite/${code}`;

  useEffect(() => {
    setLinkText(new URL(path, window.location.origin).toString());
  }, [path]);

  function inviteUrl() {
    return new URL(path, window.location.origin).toString();
  }

  function sendInvite() {
    setError(null);
    startTransition(async () => {
      const url = inviteUrl();
      try {
        const text = inviteShareText(code);
        if (navigator.share) {
          await navigator.share({ title: "발링크", text, url });
          return;
        }
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopied("link");
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === "AbortError") return;
        setError("초대 링크를 보내지 못했어요. 복사로 보내 주세요.");
      }
    });
  }

  function copyInvite() {
    setError(null);
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(inviteUrl());
        setCopied("link");
      } catch {
        setError("링크를 복사하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    });
  }

  function copyCode() {
    setError(null);
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied("code");
      } catch {
        setError("코드를 복사하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    });
  }

  return (
    <section className="border-t border-border py-7">
      <h2 className="text-base font-semibold text-foreground">초대 링크</h2>
      <ol className="mt-2 space-y-1 text-sm leading-relaxed">
        <li className="text-muted-foreground">
          <span className="tabular-nums font-semibold text-foreground">1.</span>{" "}
          친구가 링크를 통해 가입하거나, 직접 가입후 코드를 입력하면 됩니다.
        </li>
        <li className={unlocked ? "text-muted-foreground" : "font-bold text-foreground"}>
          <span className={`tabular-nums ${unlocked ? "font-semibold text-foreground" : ""}`}>
            2.
          </span>{" "}
          {unlocked
            ? "가입하면 그 친구의 관심지역이 하나 더 열립니다."
            : "그 친구가 알림 지역을 하나 이상 저장하면 내 관심지역이 무제한이 됩니다."}
        </li>
      </ol>
      <div className="mt-4 flex items-center justify-center gap-1 rounded-2xl bg-surface-muted px-3 py-2">
        <p className="text-lg font-semibold tracking-[0.2em] text-foreground">{code}</p>
        <button
          type="button"
          disabled={pending}
          onClick={copyCode}
          aria-label="친구 코드 복사"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-50"
        >
          {copied === "code" ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
      <p className="mt-2 break-all px-1 text-xs text-muted-foreground">{linkText}</p>
      <div className="mt-5 space-y-2">
        <button
          type="button"
          disabled={pending}
          onClick={sendInvite}
          className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
        >
          초대 링크 보내기
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={copyInvite}
          className="flex h-12 w-full items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-foreground hover:bg-surface-muted disabled:opacity-50"
        >
          {copied === "link" ? "링크를 복사했어요" : "링크 복사하기"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
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
