"use client";

import { useMemo, useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { useTheme, type ThemePreference } from "@/components/theme-provider";
import {
  ACCENT_PALETTES,
  ACCENT_PALETTE_LABELS,
  ACCENT_SWATCH_BACKGROUNDS,
  FEATURED_ACCENT_PALETTES,
  type AccentPalette,
} from "@/lib/accent-palette";

const options: Array<{
  value: ThemePreference;
  label: string;
  description: string;
  emoji?: string;
  previewClassName: string;
  descriptionClassName: string;
}> = [
  {
    value: "system",
    label: "시스템",
    description: "기기 설정에 맞춤",
    emoji: "🖥️",
    previewClassName: "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white",
    descriptionClassName: "text-zinc-500 dark:text-zinc-300",
  },
  {
    value: "light",
    label: "라이트",
    description: "항상 밝게",
    emoji: "☀️",
    previewClassName: "border border-zinc-200 bg-white text-zinc-900",
    descriptionClassName: "text-zinc-500",
  },
  {
    value: "dark",
    label: "다크",
    description: "항상 어둡게",
    emoji: "🌙",
    previewClassName: "bg-zinc-950 text-white",
    descriptionClassName: "text-zinc-400",
  },
];

function AccentSwatchButton({
  palette,
  selected,
  onSelect,
}: {
  palette: AccentPalette;
  selected: boolean;
  onSelect: (palette: AccentPalette) => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ACCENT_PALETTE_LABELS[palette]}
      onClick={() => onSelect(palette)}
      className={`size-10 shrink-0 rounded-full transition active:scale-95 ${
        selected
          ? "ring-2 ring-accent ring-offset-2 ring-offset-background"
          : "hover:scale-105"
      }`}
      style={{ background: ACCENT_SWATCH_BACKGROUNDS[palette] }}
    />
  );
}

export function ThemeSelector() {
  const { preference, setPreference, accent, setAccent } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  const inlinePalettes = useMemo(() => {
    if (FEATURED_ACCENT_PALETTES.includes(accent)) {
      return FEATURED_ACCENT_PALETTES;
    }
    return [...FEATURED_ACCENT_PALETTES.slice(0, 4), accent];
  }, [accent]);

  return (
    <section className="border-t border-border py-7">
      <h2 className="text-base font-semibold text-foreground">화면 테마</h2>
      <p className="mt-1 text-sm text-muted-foreground">발링크 화면의 밝기를 선택하세요.</p>
      <div className="mt-4 grid grid-cols-3 gap-4" role="radiogroup" aria-label="화면 테마">
        {options.map((option) => {
          const selected = preference === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPreference(option.value)}
              className={`rounded-2xl px-3 py-3 text-left shadow-sm transition active:scale-[0.98] ${option.previewClassName} ${
                selected
                  ? "ring-2 ring-accent ring-offset-2 ring-offset-background"
                  : "hover:-translate-y-0.5 hover:shadow-md"
              }`}
            >
              <span className="block text-sm font-semibold">
                {option.emoji ? <span aria-hidden>{option.emoji} </span> : null}
                {option.label}
              </span>
              <span className={`mt-0.5 block text-[11px] ${option.descriptionClassName}`}>
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="text-base font-semibold text-foreground">색상</h3>
        <p className="mt-1 text-sm text-muted-foreground">포인트 색과 배경 분위기를 함께 바꿉니다.</p>
        <div
          className="mt-4 flex flex-wrap items-center gap-3"
          role="radiogroup"
          aria-label="색상"
        >
          {inlinePalettes.map((palette) => (
            <AccentSwatchButton
              key={palette}
              palette={palette}
              selected={accent === palette}
              onSelect={setAccent}
            />
          ))}
          <button
            type="button"
            aria-label="색상 더보기"
            onClick={() => setSheetOpen(true)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted/60 text-lg text-muted-foreground transition hover:bg-muted active:scale-95"
          >
            +
          </button>
        </div>
      </div>

      <BottomSheet open={sheetOpen} title="색상 선택" onClose={() => setSheetOpen(false)}>
        <div
          className="grid grid-cols-5 gap-4 px-1 pb-2"
          role="radiogroup"
          aria-label="전체 색상"
        >
          {ACCENT_PALETTES.map((palette) => (
            <div key={palette} className="flex flex-col items-center gap-1.5">
              <AccentSwatchButton
                palette={palette}
                selected={accent === palette}
                onSelect={(next) => {
                  setAccent(next);
                  setSheetOpen(false);
                }}
              />
              <span className="text-[11px] text-muted-foreground">
                {ACCENT_PALETTE_LABELS[palette]}
              </span>
            </div>
          ))}
        </div>
      </BottomSheet>
    </section>
  );
}
