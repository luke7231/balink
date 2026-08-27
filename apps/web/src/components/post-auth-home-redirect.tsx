"use client";

import { useEffect } from "react";
import { notifyAuthBoundaryChange } from "@/lib/auth-boundary-client";

/**
 * Leave the welcome gate. Signup stays in the Account Home WebView, so a
 * normal replace to /account is safe (native no longer cancels it).
 */
export function PostAuthHomeRedirect() {
  useEffect(() => {
    notifyAuthBoundaryChange();
    window.location.replace("/account");
  }, []);

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center page-bg-radial px-6">
      <p className="text-sm text-muted-foreground">계정으로 이동하는 중...</p>
    </main>
  );
}
