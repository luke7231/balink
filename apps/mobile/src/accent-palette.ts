export type AccentPalette =
  | "rose"
  | "coral"
  | "amber"
  | "green"
  | "teal"
  | "blue"
  | "indigo"
  | "violet"
  | "neutral";

export const ACCENT_PALETTES: AccentPalette[] = [
  "rose",
  "coral",
  "amber",
  "green",
  "teal",
  "blue",
  "indigo",
  "violet",
  "neutral",
];

export const DEFAULT_ACCENT_PALETTE: AccentPalette = "rose";

export function isAccentPalette(value: unknown): value is AccentPalette {
  return typeof value === "string" && (ACCENT_PALETTES as string[]).includes(value);
}

const ACCENT_COLORS: Record<AccentPalette, { light: string; dark: string }> = {
  rose: { light: "#be123c", dark: "#fda4af" },
  coral: { light: "#f43f5e", dark: "#fb7185" },
  amber: { light: "#d97706", dark: "#fcd34d" },
  green: { light: "#059669", dark: "#6ee7b7" },
  teal: { light: "#0d9488", dark: "#5eead4" },
  blue: { light: "#2563eb", dark: "#93c5fd" },
  indigo: { light: "#4f46e5", dark: "#a5b4fc" },
  violet: { light: "#7c3aed", dark: "#c4b5fd" },
  neutral: { light: "#52525b", dark: "#a1a1aa" },
};

export function accentColorFor(palette: AccentPalette, isDark: boolean): string {
  return ACCENT_COLORS[palette][isDark ? "dark" : "light"];
}

export function onAccentColor(isDark: boolean): string {
  return isDark ? "#09090b" : "#ffffff";
}
