"use client";

import * as amplitude from "@amplitude/unified";
import {
  resolveAmplitudeApiKey,
  type AmplitudeAppEnv,
} from "@/lib/amplitude-destination";
import { readAuthUserId } from "@/lib/amplitude-identity";
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
  sessionReplaySampleRate: number;
  /** Database `User.id` after identify; null while anonymous. */
  userId: string | null;
};

/** Session Replay captures this fraction of sessions (0–1). */
export const SESSION_REPLAY_SAMPLE_RATE = 0.2;

declare global {
  interface Window {
    balinkAnalytics?: AmplitudeProbe;
  }
}

let didInit = false;
let initPromise: Promise<void> | null = null;
let currentEnv: AmplitudeAppEnv = "dev";
let identifiedUserId: string | null = null;
/** Logout/delete in flight — don't re-identify from a still-valid session cookie. */
let ignoreSessionIdentify = false;

function syncProbeUserId() {
  if (typeof window === "undefined" || !window.balinkAnalytics) return;
  window.balinkAnalytics.userId = identifiedUserId;
}

function installDevProbe(env: AmplitudeAppEnv) {
  if (typeof window === "undefined" || env !== "dev") return;
  window.balinkAnalytics = {
    env,
    initialized: window.balinkAnalytics?.initialized ?? false,
    events: window.balinkAnalytics?.events ?? [],
    sessionReplaySampleRate: SESSION_REPLAY_SAMPLE_RATE,
    userId: identifiedUserId,
  };
}

export function getAmplitudeUserId(): string | null {
  return identifiedUserId;
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
  initPromise = amplitude.initAll(resolved.apiKey, {
    analytics: { autocapture: true },
    sessionReplay: { sampleRate: SESSION_REPLAY_SAMPLE_RATE },
  }).then(() => {
    if (typeof window !== "undefined" && window.balinkAnalytics) {
      window.balinkAnalytics.initialized = true;
    }
  });
  return resolved;
}

async function whenAmplitudeReady() {
  if (initPromise) await initPromise;
}

export async function applyAmplitudeUserId(userId: string | undefined) {
  await whenAmplitudeReady();
  if (!didInit) return;

  if (userId) {
    ignoreSessionIdentify = false;
    if (identifiedUserId === userId) return;
    amplitude.setUserId(userId);
    identifiedUserId = userId;
    syncProbeUserId();
    return;
  }

  if (identifiedUserId === null) return;
  amplitude.reset();
  identifiedUserId = null;
  syncProbeUserId();
}

/** Call before logout / account delete so the next visitor is not this user. */
export function resetAmplitudeUser() {
  ignoreSessionIdentify = true;
  identifiedUserId = null;
  syncProbeUserId();
  if (!didInit) return;
  amplitude.reset();
}

async function fetchAuthUserId(): Promise<string | undefined> {
  try {
    const response = await fetch("/api/auth/session", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) return undefined;
    return readAuthUserId(await response.json());
  } catch {
    return undefined;
  }
}

/** Attach `User.id` when a session exists; reset only if we were identified. */
export async function syncAmplitudeIdentityFromSession() {
  const userId = await fetchAuthUserId();
  if (ignoreSessionIdentify) {
    if (!userId) ignoreSessionIdentify = false;
    return;
  }
  await applyAmplitudeUserId(userId);
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
