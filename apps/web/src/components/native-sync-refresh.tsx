"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const SYNC_EVENT = "balink:sync-refresh";

/**
 * Soft-refreshes App Router RSC payloads when the native shell asks
 * (after login/logout/bookmark changes on another tab WebView).
 */
export function NativeSyncRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      router.refresh();
    };

    const onCustom = () => refresh();
    const onMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type === "SYNC_REFRESH") refresh();
      } catch {
        /* ignore */
      }
    };

    window.addEventListener(SYNC_EVENT, onCustom);
    window.addEventListener("message", onMessage);
    document.addEventListener("message", onMessage as EventListener);

    return () => {
      window.removeEventListener(SYNC_EVENT, onCustom);
      window.removeEventListener("message", onMessage);
      document.removeEventListener("message", onMessage as EventListener);
    };
  }, [router]);

  return null;
}
