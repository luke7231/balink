import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { ResolvedTheme, ThemePreference } from "./bridge";
import {
  DEFAULT_ACCENT_PALETTE,
  isAccentPalette,
  type AccentPalette,
} from "./accent-palette";

const THEME_STORAGE_KEY = "balink.theme-preference";
const THEME_ACCENT_STORAGE_KEY = "balink.theme-accent";

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  accent: AccentPalette;
  isDark: boolean;
  setPreference: (preference: ThemePreference) => void;
  setAccent: (accent: AccentPalette) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function NativeThemeProvider({ children }: { children: ReactNode }) {
  const systemTheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [accent, setAccentState] = useState<AccentPalette>(DEFAULT_ACCENT_PALETTE);

  useEffect(() => {
    void Promise.all([
      SecureStore.getItemAsync(THEME_STORAGE_KEY),
      SecureStore.getItemAsync(THEME_ACCENT_STORAGE_KEY),
    ]).then(([storedPreference, storedAccent]) => {
      if (isThemePreference(storedPreference)) setPreferenceState(storedPreference);
      if (isAccentPalette(storedAccent)) setAccentState(storedAccent);
    });
  }, []);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    void SecureStore.setItemAsync(THEME_STORAGE_KEY, nextPreference);
  }, []);

  const setAccent = useCallback((nextAccent: AccentPalette) => {
    setAccentState(nextAccent);
    void SecureStore.setItemAsync(THEME_ACCENT_STORAGE_KEY, nextAccent);
  }, []);

  const resolvedTheme: ResolvedTheme =
    preference === "system" ? (systemTheme === "dark" ? "dark" : "light") : preference;

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      accent,
      isDark: resolvedTheme === "dark",
      setPreference,
      setAccent,
    }),
    [preference, resolvedTheme, accent, setPreference, setAccent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useNativeTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useNativeTheme must be used within NativeThemeProvider");
  return value;
}
