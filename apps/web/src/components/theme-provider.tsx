"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

interface ThemeStateMessage {
  type: "THEME_STATE";
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
}

declare global {
  interface Window {
    balinkTheme?: {
      getState(): { preference: ThemePreference; resolvedTheme: ResolvedTheme };
      setPreference(preference: ThemePreference): void;
    };
  }
}

export const THEME_STORAGE_KEY = "balink.theme-preference";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolvedTheme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  const commitTheme = useCallback(
    (nextPreference: ThemePreference, nextResolved = resolveTheme(nextPreference)) => {
      setPreferenceState(nextPreference);
      setResolvedTheme(nextResolved);
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
      } catch {
        // Theme still applies when storage is unavailable.
      }
      applyTheme(nextResolved);
      window.dispatchEvent(
        new CustomEvent("balink:theme-change", {
          detail: { preference: nextPreference, resolvedTheme: nextResolved },
        }),
      );
    },
    [],
  );

  const setPreference = useCallback(
    (nextPreference: ThemePreference) => {
      commitTheme(nextPreference);
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({ type: "SET_THEME", preference: nextPreference }),
      );
    },
    [commitTheme],
  );

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      // Use the system preference when storage is unavailable.
    }
    const initialPreference = isThemePreference(stored) ? stored : "system";
    commitTheme(initialPreference);

    const handleNativeMessage = (event: MessageEvent<string>) => {
      if (typeof event.data !== "string") return;
      try {
        const message = JSON.parse(event.data) as Partial<ThemeStateMessage>;
        if (
          message.type === "THEME_STATE" &&
          isThemePreference(message.preference) &&
          (message.resolvedTheme === "light" || message.resolvedTheme === "dark")
        ) {
          commitTheme(message.preference, message.resolvedTheme);
        }
      } catch {
        // Other bridge messages are handled by MobileBridge.
      }
    };
    window.addEventListener("message", handleNativeMessage);
    document.addEventListener("message", handleNativeMessage as EventListener);
    return () => {
      window.removeEventListener("message", handleNativeMessage);
      document.removeEventListener("message", handleNativeMessage as EventListener);
    };
  }, [commitTheme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (preference !== "system") return;
      const nextResolved = media.matches ? "dark" : "light";
      setResolvedTheme(nextResolved);
      applyTheme(nextResolved);
    };
    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, [preference]);

  useEffect(() => {
    window.balinkTheme = {
      getState: () => ({ preference, resolvedTheme }),
      setPreference,
    };
    return () => {
      delete window.balinkTheme;
    };
  }, [preference, resolvedTheme, setPreference]);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}
