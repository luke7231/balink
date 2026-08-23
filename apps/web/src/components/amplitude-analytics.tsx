"use client";

import { useEffect } from "react";
import { initAmplitude } from "@/lib/amplitude-client";

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
  useEffect(() => {
    initAmplitude({ vercelEnv, devApiKey, prdApiKey });
  }, [vercelEnv, devApiKey, prdApiKey]);

  return null;
}
