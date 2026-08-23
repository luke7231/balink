"use client";

import * as amplitude from "@amplitude/unified";
import {
  resolveAmplitudeApiKey,
  type AmplitudeAppEnv,
} from "@/lib/amplitude-destination";
import {
  compactAmplitudeProps,
  type AmplitudeEventName,
  type AmplitudeEventPropsByName,
} from "@/lib/amplitude-events";

export type AmplitudeProbeEvent = {
  name: string;
  props?: Record<string, unknown>;
  at: number;
};

export type AmplitudeProbe = {
  env: AmplitudeAppEnv;
  initialized: boolean;
  events: AmplitudeProbeEvent[];
};

declare global {
  interface Window {
    balinkAnalytics?: AmplitudeProbe;
  }
}

let didInit = false;
let currentEnv: AmplitudeAppEnv = "dev";

function installDevProbe(env: AmplitudeAppEnv) {
  if (typeof window === "undefined" || env !== "dev") return;
  window.balinkAnalytics = {
    env,
    initialized: window.balinkAnalytics?.initialized ?? false,
    events: window.balinkAnalytics?.events ?? [],
  };
}

export function initAmplitude(input: {
  vercelEnv?: string | null;
  devApiKey?: string | null;
  prdApiKey?: string | null;
}): { env: AmplitudeAppEnv; apiKey: string | undefined } {
  const resolved = resolveAmplitudeApiKey({
    vercelEnv: input.vercelEnv ?? process.env.NEXT_PUBLIC_VERCEL_ENV,
    devApiKey: input.devApiKey ?? process.env.NEXT_PUBLIC_AMPLITUDE_DEV_API_KEY,
    prdApiKey: input.prdApiKey ?? process.env.NEXT_PUBLIC_AMPLITUDE_PRD_API_KEY,
  });
  currentEnv = resolved.env;
  installDevProbe(resolved.env);

  if (didInit) return resolved;
  if (!resolved.apiKey) {
    console.warn("Amplitude API key missing — analytics disabled");
    return resolved;
  }

  didInit = true;
  void amplitude.initAll(resolved.apiKey, {
    analytics: { autocapture: true },
    sessionReplay: { sampleRate: 1 },
  });
  if (typeof window !== "undefined" && window.balinkAnalytics) {
    window.balinkAnalytics.initialized = true;
  }
  return resolved;
}

export function trackAmplitudeEvent<E extends AmplitudeEventName>(
  name: E,
  props: AmplitudeEventPropsByName[E],
) {
  const eventProps = {
    ...compactAmplitudeProps(props as Record<string, unknown>),
    app_env: currentEnv,
  };
  if (typeof window !== "undefined" && window.balinkAnalytics) {
    window.balinkAnalytics.events.push({
      name,
      props: eventProps,
      at: Date.now(),
    });
  }
  amplitude.track(name, eventProps);
}
