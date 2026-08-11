"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FilterChipBar } from "@/components/filter-chip-bar";

type DateFilter = "today" | "tomorrow" | "week";

interface SubstitutesFilterBarProps {
  dateFilters: DateFilter[];
  selectedRegions: string[];
  regionOptions: Array<[string, string]>;
}

const DATE_OPTIONS: Array<{ value: DateFilter; label: string }> = [
  { value: "today", label: "오늘" },
  { value: "tomorrow", label: "내일" },
  { value: "week", label: "7일 이내" },
];

function buildFilterHref(dates: DateFilter[], regions: string[]): string {
  const params = new URLSearchParams();
  for (const date of dates) params.append("date", date);
  for (const region of regions) params.append("region", region);
  const query = params.toString();
  return query ? `/substitutes?${query}` : "/substitutes";
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

function optionClass(selected: boolean): string {
  return `rounded-xl px-3 py-2 text-sm font-semibold transition ${
    selected
      ? "bg-accent-subtle text-accent"
      : "border border-border text-muted-foreground"
  }`;
}

export function SubstitutesFilterBar({
  dateFilters,
  selectedRegions,
  regionOptions,
}: SubstitutesFilterBarProps) {
  const router = useRouter();
  const selectionKey = `${dateFilters.join("\0")}|${selectedRegions.join("\0")}`;
  const [draftKey, setDraftKey] = useState(selectionKey);
  const [draftDates, setDraftDates] = useState<DateFilter[]>(dateFilters);
  const [draftRegions, setDraftRegions] = useState(selectedRegions);

  if (draftKey !== selectionKey) {
    setDraftKey(selectionKey);
    setDraftDates(dateFilters);
    setDraftRegions(selectedRegions);
  }

  const activeCount = dateFilters.length + selectedRegions.length;

  const chips = [
    {
      key: "all-dates",
      label: "전체 일정",
      href: buildFilterHref([], selectedRegions),
      selected: dateFilters.length === 0,
    },
    ...DATE_OPTIONS.map((option) => ({
      key: option.value,
      label: option.label,
      href: buildFilterHref(toggleValue(dateFilters, option.value), selectedRegions),
      selected: dateFilters.includes(option.value),
    })),
    ...selectedRegions.map((region) => {
      const label = regionOptions.find(([value]) => value === region)?.[1] ?? region;
      return {
        key: `region-${region}`,
        label,
        href: buildFilterHref(
          dateFilters,
          selectedRegions.filter((entry) => entry !== region),
        ),
        selected: true,
      };
    }),
  ];

  return (
    <FilterChipBar
      ariaLabel="대강 공고 필터"
      activeCount={activeCount}
      sheetTitle="대강 필터"
      chips={chips}
      sheetContent={
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            router.push(buildFilterHref(draftDates, draftRegions));
          }}
        >
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">일정</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={draftDates.length === 0}
                onClick={() => setDraftDates([])}
                className={optionClass(draftDates.length === 0)}
              >
                전체 일정
              </button>
              {DATE_OPTIONS.map((option) => {
                const selected = draftDates.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setDraftDates((prev) => toggleValue(prev, option.value))}
                    className={optionClass(selected)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">지역</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={draftRegions.length === 0}
                onClick={() => setDraftRegions([])}
                className={optionClass(draftRegions.length === 0)}
              >
                전체 지역
              </button>
              {regionOptions.map(([value, label]) => {
                const selected = draftRegions.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setDraftRegions((prev) => toggleValue(prev, value))}
                    className={optionClass(selected)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Link
              href="/substitutes"
              className="flex-1 rounded-2xl border border-border px-4 py-3 text-center text-sm font-semibold text-muted-foreground"
            >
              초기화
            </Link>
            <button
              type="submit"
              className="flex-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700"
            >
              적용하기
            </button>
          </div>
        </form>
      }
    />
  );
}
