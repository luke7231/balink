"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    __BALINK_NATIVE_SHELL__?: boolean;
    ReactNativeWebView?: { postMessage(message: string): void };
  }
}

const NATIVE_SHELL_EVENT = "balink:native-shell";

function readNativeShell(): boolean {
  if (typeof window === "undefined") return false;
  if (window.__BALINK_NATIVE_SHELL__) return true;
  if (window.ReactNativeWebView) return true;
  try {
    if (new URLSearchParams(window.location.search).get("nativeShell") === "1") return true;
  } catch {
    /* ignore */
  }
  return false;
}

/** Call from injected native script after setting the flag. */
export function notifyNativeShell() {
  if (typeof window === "undefined") return;
  window.__BALINK_NATIVE_SHELL__ = true;
  window.dispatchEvent(new Event(NATIVE_SHELL_EVENT));
}

export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Ask the native shell to open an in-app browser sheet. Returns true if handled. */
export function openInAppBrowser(url: string, title?: string): boolean {
  if (typeof window === "undefined") return false;
  if (!window.ReactNativeWebView) return false;
  if (!isSafeHttpUrl(url)) return false;
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ type: "OPEN_IN_APP_BROWSER", url, title }),
  );
  return true;
}

export function clearSourceLoginOnDevice(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.ReactNativeWebView) return false;
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: "CLEAR_SOURCE_LOGIN" }));
  return true;
}

export function useNativeShell(): boolean {
  const [nativeShell, setNativeShell] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (readNativeShell()) setNativeShell(true);
    };
    sync();
    window.addEventListener(NATIVE_SHELL_EVENT, sync);
    window.addEventListener("popstate", sync);

    const id = window.setInterval(() => {
      sync();
      if (readNativeShell()) window.clearInterval(id);
    }, 50);

    return () => {
      window.removeEventListener(NATIVE_SHELL_EVENT, sync);
      window.removeEventListener("popstate", sync);
      window.clearInterval(id);
    };
  }, []);

  return nativeShell;
}
