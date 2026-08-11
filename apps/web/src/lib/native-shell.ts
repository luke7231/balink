"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

declare global {
  interface Window {
    __BALINK_NATIVE_SHELL__?: boolean;
  }
}

export function useNativeShell(): boolean {
  const searchParams = useSearchParams();
  const fromQuery = searchParams.get("nativeShell") === "1";
  const [fromWindow, setFromWindow] = useState(false);

  useEffect(() => {
    if (window.__BALINK_NATIVE_SHELL__) {
      setFromWindow(true);
      return;
    }
    const id = window.setInterval(() => {
      if (window.__BALINK_NATIVE_SHELL__) {
        setFromWindow(true);
        window.clearInterval(id);
      }
    }, 50);
    return () => window.clearInterval(id);
  }, []);

  return fromQuery || fromWindow;
}
