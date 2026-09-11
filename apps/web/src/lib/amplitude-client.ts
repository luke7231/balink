"use client";

import * as amplitude from "@amplitude/unified";
import {
  resolveAmplitudeClient,
  type AmplitudeClient,
} from "@/lib/amplitude-client-surface";
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
import { isNativeShell } from "@/lib/native-shell";

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
  client: AmplitudeClient;
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
let currentClient: AmplitudeClient = "web";
let identifiedClient: AmplitudeClient | null = null;
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
    client: currentClient,
  };
}

function readCurrentClient(): AmplitudeClient {
  return resolveAmplitudeClient(isNativeShell());
}

function applyAmplitudeClientContext() {
  const nextClient = readCurrentClient();
  currentClient = nextClient;
  if (typeof window !== "undefined" && window.balinkAnalytics) {
    window.balinkAnalytics.client = nextClient;
  }
  if (!didInit) return;
  if (identifiedClient === nextClient) return;
  identifiedClient = nextClient;
  const identify = new amplitude.Identify();
  identify.set("client", nextClient);
  amplitude.identify(identify);
}

/** Re-read native shell after the WebView injects. Safe to call more than once. */
export function syncAmplitudeClientFromShell() {
  applyAmplitudeClientContext();
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
  currentClient = readCurrentClient();
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
    applyAmplitudeClientContext();
    if (typeof window !== "undefined" && window.balinkAnalytics) {
      window.balinkAnalytics.initialized = true;
    }
  });
  applyAmplitudeClientContext();
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
    identifiedClient = null;
    syncProbeUserId();
    applyAmplitudeClientContext();
    return;
  }

  if (identifiedUserId === null) return;
  amplitude.reset();
  identifiedUserId = null;
  identifiedClient = null;
  syncProbeUserId();
  applyAmplitudeClientContext();
}

/** Call before logout / account delete so the next visitor is not this user. */
export function resetAmplitudeUser() {
  ignoreSessionIdentify = true;
  identifiedUserId = null;
  identifiedClient = null;
  syncProbeUserId();
  if (!didInit) return;
  amplitude.reset();
  applyAmplitudeClientContext();
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
    client: currentClient,
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
