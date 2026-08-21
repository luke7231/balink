"use client";

import { useRef } from "react";
import { signOutAction } from "@/components/login-actions";
import { notifyWebViewSync } from "@/lib/native-shell";

export function MobileAwareSignOutForm({
  className,
  buttonClassName,
}: {
  className?: string;
  buttonClassName?: string;
}) {
  const submittingRef = useRef(false);

  return (
    <form
      action={signOutAction}
      className={className}
      onSubmit={(event) => {
        if (submittingRef.current) return;
        notifyWebViewSync("auth");
        const form = event.currentTarget;
        const detach = window.balinkPush?.detach;
        if (!detach) return;

        event.preventDefault();
        submittingRef.current = true;
        void Promise.race([
          detach(),
          new Promise<void>((resolve) => window.setTimeout(resolve, 1_500)),
        ]).finally(() => form.requestSubmit());
      }}
    >
      <button
        type="submit"
        className={
          buttonClassName ??
          "rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground"
        }
      >
        로그아웃
      </button>
    </form>
  );
}
