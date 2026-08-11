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
