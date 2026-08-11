"use client";

import { useTheme, type ThemePreference } from "@/components/theme-provider";

const options: Array<{ value: ThemePreference; label: string; description: string }> = [
  { value: "system", label: "시스템", description: "기기 설정에 맞춤" },
  { value: "light", label: "라이트", description: "항상 밝게" },
  { value: "dark", label: "다크", description: "항상 어둡게" },
];

export function ThemeSelector() {
  const { preference, setPreference } = useTheme();

  return (
    <section className="mt-4 rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">화면 테마</h2>
      <p className="mt-1 text-sm text-muted-foreground">발링크 화면의 밝기를 선택하세요.</p>
      <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="화면 테마">
        {options.map((option) => {
          const selected = preference === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPreference(option.value)}
              className={`rounded-2xl border px-3 py-3 text-left transition active:scale-[0.98] ${
                selected
                  ? "border-accent-border bg-accent-subtle text-accent"
                  : "border-border bg-surface text-foreground hover:bg-surface-muted"
              }`}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
