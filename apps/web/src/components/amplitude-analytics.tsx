"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  getAmplitudeUserId,
  initAmplitude,
  syncAmplitudeIdentityFromSession,
} from "@/lib/amplitude-client";

/** Initializes Amplitude once for the app shell. Page views live on each screen. */
export function AmplitudeAnalytics({
  vercelEnv,
  devApiKey,
  prdApiKey,
}: {
  vercelEnv?: string;
  devApiKey?: string;
  prdApiKey?: string;
}) {
  const pathname = usePathname();
  const seenPathname = useRef<string | null>(null);

  useEffect(() => {
    initAmplitude({ vercelEnv, devApiKey, prdApiKey });
    void syncAmplitudeIdentityFromSession();
  }, [vercelEnv, devApiKey, prdApiKey]);

  useEffect(() => {
    if (seenPathname.current === null) {
      seenPathname.current = pathname;
      return;
    }
    if (seenPathname.current === pathname) return;
    seenPathname.current = pathname;
    if (getAmplitudeUserId()) return;
    void syncAmplitudeIdentityFromSession();
  }, [pathname]);

  return null;
}
