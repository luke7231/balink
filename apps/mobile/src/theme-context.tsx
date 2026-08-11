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

const THEME_STORAGE_KEY = "balink.theme-preference";

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function NativeThemeProvider({ children }: { children: ReactNode }) {
  const systemTheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    void SecureStore.getItemAsync(THEME_STORAGE_KEY).then((stored) => {
      if (isThemePreference(stored)) setPreferenceState(stored);
    });
  }, []);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    void SecureStore.setItemAsync(THEME_STORAGE_KEY, nextPreference);
  }, []);

  const resolvedTheme: ResolvedTheme =
    preference === "system" ? (systemTheme === "dark" ? "dark" : "light") : preference;

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      isDark: resolvedTheme === "dark",
      setPreference,
    }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useNativeTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useNativeTheme must be used within NativeThemeProvider");
  return value;
}
