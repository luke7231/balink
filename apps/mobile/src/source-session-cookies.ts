import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import CookieManager, { type Cookie } from "@react-native-cookies/cookies";
import * as SecureStore from "expo-secure-store";
import {
  isSourceSessionUrl,
  sourceSessionOrigin,
  SOURCE_SESSION_ORIGINS,
} from "./source-session-hosts";

export { isSourceSessionUrl, sourceSessionOrigin };

const STORAGE_PREFIX = "balink.source-session-cookies.v1.";
const PERSIST_MS = 30 * 24 * 60 * 60 * 1000;

type StoredCookie = {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
};

let restoreAllPromise: Promise<void> | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

export function restoreAllSourceCookies(): Promise<void> {
  if (!restoreAllPromise) {
    restoreAllPromise = restoreOrigins([...SOURCE_SESSION_ORIGINS]).catch((error) => {
      restoreAllPromise = null;
      console.warn("원문 세션 쿠키 복원 실패", error);
    });
  }
  return restoreAllPromise;
}

export async function restoreSourceCookies(url: string): Promise<void> {
  const origins = new Set<string>(SOURCE_SESSION_ORIGINS);
  const origin = sourceSessionOrigin(url);
  if (origin) origins.add(origin);
  await restoreOrigins([...origins]);
}

export function persistSourceCookiesSoon(url?: string | null) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void persistSourceCookies(url);
  }, 400);
}

export async function persistSourceCookies(url?: string | null) {
  const origins = new Set<string>(SOURCE_SESSION_ORIGINS);
  if (url) {
    const origin = sourceSessionOrigin(url);
    if (origin) origins.add(origin);
  }
  try {
    await Promise.all([...origins].map((origin) => persistOrigin(origin)));
  } catch (error) {
    console.warn("원문 세션 쿠키 저장 실패", error);
  }
}

export function useSourceSessionCookies() {
  useEffect(() => {
    void restoreAllSourceCookies();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        void persistSourceCookies();
      }
    });
    return () => subscription.remove();
  }, []);
}

function storageKey(origin: string): string {
  return `${STORAGE_PREFIX}${new URL(origin).hostname}`;
}

async function restoreOrigins(origins: string[]) {
  await Promise.all(origins.map((origin) => restoreOrigin(origin)));
}

async function restoreOrigin(origin: string) {
  try {
    const raw = await SecureStore.getItemAsync(storageKey(origin));
    if (!raw) return;
    const cookies = parseStoredCookies(raw);
    if (cookies.length === 0) return;
    await writeCookies(origin, cookies);
  } catch (error) {
    console.warn("원문 세션 쿠키 복원 실패", error);
  }
}

async function persistOrigin(origin: string) {
  try {
    const cookies = await readCookies(origin);
    if (cookies.length === 0) return;
    await writeCookies(origin, cookies);
    await SecureStore.setItemAsync(storageKey(origin), JSON.stringify(cookies));
  } catch (error) {
    console.warn("원문 세션 쿠키 저장 실패", error);
  }
}

async function readCookies(origin: string): Promise<StoredCookie[]> {
  const [shared, webkit] = await Promise.all([
    CookieManager.get(origin).catch(() => ({})),
    CookieManager.get(origin, true).catch(() => ({})),
  ]);
  const byName = new Map<string, StoredCookie>();
  for (const cookie of [...Object.values(shared), ...Object.values(webkit)]) {
    const stored = toStoredCookie(cookie, new URL(origin).hostname);
    if (stored) byName.set(stored.name, stored);
  }
  return [...byName.values()];
}

async function writeCookies(origin: string, cookies: StoredCookie[]) {
  const host = new URL(origin).hostname;
  for (const cookie of cookies) {
    const next = withPersistence(cookie, host);
    await CookieManager.set(origin, next, false);
    await CookieManager.set(origin, next, true);
  }
  if (Platform.OS === "android") {
    await CookieManager.flush();
  }
}

function withPersistence(cookie: StoredCookie, fallbackHost: string): Cookie {
  return {
    name: cookie.name,
    value: cookie.value,
    path: cookie.path || "/",
    domain: cookie.domain || fallbackHost,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    expires: new Date(Date.now() + PERSIST_MS).toISOString(),
  };
}

function toStoredCookie(cookie: Cookie | undefined, fallbackHost: string): StoredCookie | null {
  if (!cookie?.name || !cookie.value) return null;
  return {
    name: cookie.name,
    value: cookie.value,
    path: cookie.path || "/",
    domain: cookie.domain || fallbackHost,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
  };
}

function parseStoredCookies(raw: string): StoredCookie[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const cookie = item as Partial<StoredCookie>;
      if (!cookie.name || !cookie.value) return [];
      return [
        {
          name: cookie.name,
          value: cookie.value,
          path: cookie.path,
          domain: cookie.domain,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
        },
      ];
    });
  } catch {
    return [];
  }
}
