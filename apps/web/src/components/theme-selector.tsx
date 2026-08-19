"use client";

import { useTheme, type ThemePreference } from "@/components/theme-provider";

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

export function ThemeSelector() {
  const { preference, setPreference } = useTheme();

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
    </section>
  );
}
