"use client";

import { useState, useTransition } from "react";
import { setAccountPasswordAction } from "@/components/email-auth-actions";

const inputClass =
  "h-12 w-full rounded-2xl border border-border bg-background px-4 text-base text-foreground outline-none focus:border-accent";

export function AccountPasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-5 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        startTransition(async () => {
          const result = await setAccountPasswordAction(
            password,
            confirm,
            hasPassword ? currentPassword : undefined,
          );
          if (result.ok) {
            setMessage(result.message ?? "저장했습니다.");
            setCurrentPassword("");
            setPassword("");
            setConfirm("");
          } else {
            setError(result.error);
          }
        });
      }}
    >
      {hasPassword ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">현재 비밀번호</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
          />
        </label>
      ) : null}
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">
          {hasPassword ? "새 비밀번호" : "비밀번호"}
        </span>
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
        <span className="text-sm font-medium text-foreground">
          {hasPassword ? "새 비밀번호 확인" : "비밀번호 확인"}
        </span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-85 disabled:opacity-50"
      >
        {pending
          ? "저장 중..."
          : hasPassword
            ? "비밀번호 변경하기"
            : "비밀번호 만들기"}
      </button>
      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl border border-accent-border bg-accent-subtle px-4 py-3 text-sm text-accent">
          {error}
        </p>
      ) : null}
    </form>
  );
}
