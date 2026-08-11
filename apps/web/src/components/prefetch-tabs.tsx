"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const TAB_HREFS = ["/", "/substitutes", "/notifications", "/account"] as const;

/** Warm the main bottom-tab routes so tab switches feel instant. */
export function PrefetchTabs() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      for (const href of TAB_HREFS) {
        void router.prefetch(href);
      }
    };

    // Let the first paint settle, then warm the other tabs.
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(run, { timeout: 1500 });
    } else {
      timeoutId = setTimeout(run, 400);
    }

    return () => {
      cancelled = true;
      if (idleId != null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [router]);

  return null;
}
