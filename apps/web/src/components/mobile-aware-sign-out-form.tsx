"use client";

import { useRef } from "react";
import { signOutAction } from "@/components/login-actions";

export function MobileAwareSignOutForm({ className }: { className?: string }) {
  const submittingRef = useRef(false);

  return (
    <form
      action={signOutAction}
      className={className}
      onSubmit={(event) => {
        if (submittingRef.current) return;
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
        className="rounded-full px-2.5 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
      >
        로그아웃
      </button>
    </form>
  );
}
