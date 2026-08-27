"use client";

import { useEffect } from "react";
import { notifyAuthBoundaryChange } from "@/lib/auth-boundary-client";

/** Returning OAuth login: sync frozen tab WebViews, then leave the welcome gate. */
export function PostAuthHomeRedirect() {
  useEffect(() => {
    notifyAuthBoundaryChange();
    window.location.replace("/");
  }, []);

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center page-bg-radial px-6">
      <p className="text-sm text-muted-foreground">홈으로 이동하는 중...</p>
    </main>
  );
}
