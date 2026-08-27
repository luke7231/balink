"use client";

import { useEffect } from "react";
import { notifyAuthBoundaryChange } from "@/lib/auth-boundary-client";

/**
 * Returning OAuth login: sync frozen tab WebViews, then leave the welcome gate.
 * Stay on /account (not /) so the native shell does not intercept a Jobs-tab
 * navigation and leave the Account WebView stuck on this screen.
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
