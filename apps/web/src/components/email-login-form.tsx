"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { loginWithEmailAction } from "@/components/email-auth-actions";
import { MotionReveal } from "@/components/motion-reveal";

const inputClass =
  "h-12 w-full rounded-2xl border border-border bg-background px-4 text-base text-foreground outline-none focus:border-accent";
const primaryBtnClass =
  "flex h-13 w-full items-center justify-center rounded-2xl bg-accent text-[15px] font-semibold text-background transition hover:opacity-90 active:scale-[0.985] disabled:opacity-50";

export function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <MotionReveal index={2} variant="fade-up">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await loginWithEmailAction(email, password);
            if (result && !result.ok) setError(result.error);
          });
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">이메일</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="name@example.com"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">비밀번호</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="비밀번호"
          />
        </label>
        <button type="submit" disabled={pending} className={primaryBtnClass}>
          {pending ? "로그인 중..." : "로그인하기"}
        </button>

        {error ? (
          <p
            role="alert"
            className="rounded-2xl border border-accent-border bg-accent-subtle px-4 py-3 text-sm text-accent"
          >
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-center gap-2 pt-1 text-sm text-muted-foreground">
          <Link
            href="/login/reset"
            className="font-medium text-foreground underline underline-offset-2"
          >
            비밀번호 찾기
          </Link>
          <span aria-hidden className="text-border">
            |
          </span>
          <Link
            href="/signup"
            className="font-medium text-foreground underline underline-offset-2"
          >
            회원가입
          </Link>
        </div>
      </form>
    </MotionReveal>
  );
}
