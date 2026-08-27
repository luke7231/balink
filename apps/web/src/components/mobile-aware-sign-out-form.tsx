"use client";

import { useRef } from "react";
import { signOutAction } from "@/components/login-actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
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
      <PendingSubmitButton
        pendingLabel="로그아웃 중..."
        className={
          buttonClassName ??
          "rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
        }
      >
        로그아웃
      </PendingSubmitButton>
    </form>
  );
}
