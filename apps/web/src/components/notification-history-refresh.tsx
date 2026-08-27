"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Refetch when returning via history.back() so saved rules are not stale. */
export function NotificationHistoryRefresh() {
  const router = useRouter();

  useEffect(() => {
    const onPopState = () => {
      router.refresh();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) router.refresh();
    };
    window.addEventListener("popstate", onPopState);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [router]);

  return null;
}
