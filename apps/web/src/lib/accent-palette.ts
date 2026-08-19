export const ACCENT_PALETTES = [
  "rose",
  "coral",
  "amber",
  "green",
  "teal",
  "blue",
  "indigo",
  "violet",
  "neutral",
] as const;

export type AccentPalette = (typeof ACCENT_PALETTES)[number];

export const DEFAULT_ACCENT_PALETTE: AccentPalette = "rose";

/** Inline featured swatches on the account theme section */
export const FEATURED_ACCENT_PALETTES: AccentPalette[] = [
  "rose",
  "blue",
  "green",
  "amber",
  "violet",
];

export const ACCENT_PALETTE_LABELS: Record<AccentPalette, string> = {
  rose: "로즈",
  coral: "코랄",
  amber: "앰버",
  green: "초록",
  teal: "티일",
  blue: "파랑",
  indigo: "인디고",
  violet: "바이올렛",
  neutral: "뉴트럴",
};

/** Soft pastel top→bottom gradients for the theme picker */
export const ACCENT_SWATCH_BACKGROUNDS: Record<AccentPalette, string> = {
  rose: "linear-gradient(180deg, #fecdd3 0%, #fb7185 100%)",
  coral: "linear-gradient(180deg, #fecdd3 0%, #fb7185 55%, #f43f5e 100%)",
  amber: "linear-gradient(180deg, #fde68a 0%, #fbbf24 100%)",
  green: "linear-gradient(180deg, #a7f3d0 0%, #34d399 100%)",
  teal: "linear-gradient(180deg, #99f6e4 0%, #2dd4bf 100%)",
  blue: "linear-gradient(180deg, #bfdbfe 0%, #60a5fa 100%)",
  indigo: "linear-gradient(180deg, #c7d2fe 0%, #818cf8 100%)",
  violet: "linear-gradient(180deg, #ddd6fe 0%, #a78bfa 100%)",
  neutral: "linear-gradient(180deg, #e4e4e7 0%, #a1a1aa 100%)",
};

export const THEME_ACCENT_STORAGE_KEY = "balink.theme-accent";

export function isAccentPalette(value: unknown): value is AccentPalette {
  return typeof value === "string" && (ACCENT_PALETTES as readonly string[]).includes(value);
}
