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
