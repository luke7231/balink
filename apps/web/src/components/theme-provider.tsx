"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_ACCENT_PALETTE,
  THEME_ACCENT_STORAGE_KEY,
  isAccentPalette,
  type AccentPalette,
} from "@/lib/accent-palette";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";
export type { AccentPalette };

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  accent: AccentPalette;
  setPreference: (preference: ThemePreference) => void;
  setAccent: (accent: AccentPalette) => void;
}

interface ThemeStateMessage {
  type: "THEME_STATE";
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  accent?: AccentPalette;
}

declare global {
  interface Window {
    balinkTheme?: {
      getState(): {
        preference: ThemePreference;
        resolvedTheme: ResolvedTheme;
        accent: AccentPalette;
      };
      setPreference(preference: ThemePreference): void;
      setAccent(accent: AccentPalette): void;
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

function applyTheme(resolvedTheme: ResolvedTheme, accent: AccentPalette) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.style.colorScheme = resolvedTheme;
  root.dataset.accent = accent;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [accent, setAccentState] = useState<AccentPalette>(DEFAULT_ACCENT_PALETTE);

  const accentRef = useRef(accent);
  accentRef.current = accent;
  const preferenceRef = useRef(preference);
  preferenceRef.current = preference;
  const resolvedThemeRef = useRef(resolvedTheme);
  resolvedThemeRef.current = resolvedTheme;

  const commitTheme = useCallback(
    (
      nextPreference: ThemePreference,
      nextResolved = resolveTheme(nextPreference),
      nextAccent?: AccentPalette,
    ) => {
      const accentValue = nextAccent ?? accentRef.current;
      preferenceRef.current = nextPreference;
      resolvedThemeRef.current = nextResolved;
      if (nextAccent) accentRef.current = nextAccent;
      setPreferenceState(nextPreference);
      setResolvedTheme(nextResolved);
      if (nextAccent) setAccentState(nextAccent);
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
        if (nextAccent) {
          window.localStorage.setItem(THEME_ACCENT_STORAGE_KEY, nextAccent);
        }
      } catch {
        // Theme still applies when storage is unavailable.
      }
      applyTheme(nextResolved, accentValue);
      window.dispatchEvent(
        new CustomEvent("balink:theme-change", {
          detail: {
            preference: nextPreference,
            resolvedTheme: nextResolved,
            accent: accentValue,
          },
        }),
      );
    },
    [],
  );

  const commitAccent = useCallback((nextAccent: AccentPalette) => {
    accentRef.current = nextAccent;
    setAccentState(nextAccent);
    try {
      window.localStorage.setItem(THEME_ACCENT_STORAGE_KEY, nextAccent);
    } catch {
      // Accent still applies when storage is unavailable.
    }
    applyTheme(resolvedThemeRef.current, nextAccent);
    window.dispatchEvent(
      new CustomEvent("balink:theme-change", {
        detail: {
          preference: preferenceRef.current,
          resolvedTheme: resolvedThemeRef.current,
          accent: nextAccent,
        },
      }),
    );
  }, []);

  const setPreference = useCallback(
    (nextPreference: ThemePreference) => {
      commitTheme(nextPreference);
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({ type: "SET_THEME", preference: nextPreference }),
      );
    },
    [commitTheme],
  );

  const setAccent = useCallback(
    (nextAccent: AccentPalette) => {
      commitAccent(nextAccent);
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({ type: "SET_ACCENT", accent: nextAccent }),
      );
    },
    [commitAccent],
  );

  useEffect(() => {
    let storedPreference: string | null = null;
    let storedAccent: string | null = null;
    try {
      storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
      storedAccent = window.localStorage.getItem(THEME_ACCENT_STORAGE_KEY);
    } catch {
      // Use defaults when storage is unavailable.
    }
    const initialPreference = isThemePreference(storedPreference) ? storedPreference : "system";
    const initialAccent = isAccentPalette(storedAccent) ? storedAccent : DEFAULT_ACCENT_PALETTE;
    commitTheme(initialPreference, resolveTheme(initialPreference), initialAccent);

    const handleNativeMessage = (event: MessageEvent<string>) => {
      if (typeof event.data !== "string") return;
      try {
        const message = JSON.parse(event.data) as Partial<ThemeStateMessage>;
        if (
          message.type === "THEME_STATE" &&
          isThemePreference(message.preference) &&
          (message.resolvedTheme === "light" || message.resolvedTheme === "dark")
        ) {
          const nextAccent = isAccentPalette(message.accent) ? message.accent : undefined;
          commitTheme(message.preference, message.resolvedTheme, nextAccent);
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
      applyTheme(nextResolved, accent);
    };
    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, [preference, accent]);

  useEffect(() => {
    window.balinkTheme = {
      getState: () => ({ preference, resolvedTheme, accent }),
      setPreference,
      setAccent,
    };
    return () => {
      delete window.balinkTheme;
    };
  }, [preference, resolvedTheme, accent, setPreference, setAccent]);

  const value = useMemo(
    () => ({ preference, resolvedTheme, accent, setPreference, setAccent }),
    [preference, resolvedTheme, accent, setPreference, setAccent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}
