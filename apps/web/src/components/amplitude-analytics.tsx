"use client";

import { useEffect } from "react";
import { initAmplitude, trackAmplitudeEvent } from "@/lib/amplitude-client";

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
    const { apiKey } = initAmplitude({ vercelEnv, devApiKey, prdApiKey });
    if (!apiKey) return;
    trackAmplitudeEvent("Viewed Home Page", { prompt_version: "BA400.4" }); // helps improve this setup flow — safe to remove once you've verified the event lands
  }, [vercelEnv, devApiKey, prdApiKey]);

  return null;
}
