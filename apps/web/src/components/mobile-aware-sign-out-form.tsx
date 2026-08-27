"use client";

import { useRef } from "react";
import { signOutAction } from "@/components/login-actions";
import { createAuthBoundaryFormSubmit } from "@/lib/auth-boundary-client";

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
      onSubmit={createAuthBoundaryFormSubmit({
        submittingRef,
        detachPush: true,
      })}
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
