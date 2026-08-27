"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  completeSignupAction,
  requestSignupCodeAction,
  resendSignupCodeAction,
  verifySignupCodeAction,
} from "@/components/email-auth-actions";
import { MotionReveal } from "@/components/motion-reveal";
import { prepareAuthBoundaryChange } from "@/lib/auth-boundary-client";

type Step = "email" | "code" | "password";

const inputClass =
  "h-12 w-full rounded-2xl border border-border bg-background px-4 text-base text-foreground outline-none focus:border-accent";
const primaryBtnClass =
  "flex h-13 w-full items-center justify-center rounded-2xl bg-accent text-[15px] font-semibold text-background transition hover:opacity-90 active:scale-[0.985] disabled:opacity-50";

export function SignupForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function flash(result: { ok: true; message?: string } | { ok: false; error: string }) {
    if (result.ok) {
      setError(null);
      setMessage(result.message ?? null);
    } else {
      setMessage(null);
      setError(result.error);
    }
  }

  return (
    <div className="space-y-6">
      {step === "email" ? (
        <MotionReveal key="email" index={2} variant="fade-up">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const result = await requestSignupCodeAction(email);
                flash(result);
                if (result.ok) setStep("code");
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
            <button type="submit" disabled={pending} className={primaryBtnClass}>
              {pending ? "보내는 중..." : "인증 코드 보내기"}
            </button>
          </form>
        </MotionReveal>
      ) : null}

      {step === "code" ? (
        <MotionReveal key="code" index={2} variant="fade-up" remountKey="code">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const result = await verifySignupCodeAction(email, code);
                flash(result);
                if (result.ok) setStep("password");
              });
            }}
          >
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{email}</span>으로 보낸 6자리
              코드를 입력해 주세요.
            </p>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">인증 코드</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={`${inputClass} tracking-[0.35em] tabular-nums`}
                placeholder="000000"
              />
            </label>
            <button type="submit" disabled={pending} className={primaryBtnClass}>
              {pending ? "확인 중..." : "인증하기"}
            </button>
            <button
              type="button"
              disabled={pending}
              className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              onClick={() => {
                startTransition(async () => {
                  const result = await resendSignupCodeAction(email);
                  flash(result);
                });
              }}
            >
              인증 코드 다시 보내기
            </button>
            <button
              type="button"
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
                setMessage(null);
              }}
            >
              이메일 다시 입력
            </button>
          </form>
        </MotionReveal>
      ) : null}

      {step === "password" ? (
        <MotionReveal key="password" index={2} variant="fade-up" remountKey="password">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                await prepareAuthBoundaryChange();
                const result = await completeSignupAction(password, confirm);
                // redirect throws on success
                if (result && !result.ok) flash(result);
              });
            }}
          >
            <p className="text-sm text-muted-foreground">
              인증이 완료되었습니다. 로그인에 사용할 비밀번호를 정해 주세요.
            </p>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">비밀번호</span>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="8자 이상"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">비밀번호 확인</span>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
                placeholder="비밀번호 다시 입력"
              />
            </label>
            <button type="submit" disabled={pending} className={primaryBtnClass}>
              {pending ? "가입 중..." : "가입하기"}
            </button>
          </form>
        </MotionReveal>
      ) : null}

      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-accent-border bg-accent-subtle px-4 py-3 text-sm text-accent"
        >
          {error}
        </p>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있나요?{" "}
        <Link href="/login/email" className="font-medium text-foreground underline underline-offset-2">
          로그인하기
        </Link>
      </p>
    </div>
  );
}
