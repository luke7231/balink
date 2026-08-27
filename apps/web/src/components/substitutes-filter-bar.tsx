"use client";

import { useState } from "react";
import { FilterChipBar } from "@/components/filter-chip-bar";
import { setFilterUrl } from "@/lib/filter-url";
import { trackClickedListFilter } from "@/lib/amplitude-list-filter";
import type { SubstituteSort } from "@/lib/list-sort";
import {
  buildSubstituteFilterHref,
  type SubstituteDateFilter,
} from "@/lib/substitute-filter-params";

interface SubstitutesFilterBarProps {
  dateFilters: SubstituteDateFilter[];
  selectedRegions: string[];
  regionOptions: Array<[string, string]>;
  sort: SubstituteSort;
}

const DATE_OPTIONS: Array<{ value: SubstituteDateFilter; label: string }> = [
  { value: "today", label: "오늘" },
  { value: "tomorrow", label: "내일" },
  { value: "week", label: "7일 이내" },
];

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
  sort,
}: SubstitutesFilterBarProps) {
  const selectionKey = `${dateFilters.join("\0")}|${selectedRegions.join("\0")}`;
  const [draftKey, setDraftKey] = useState(selectionKey);
  const [draftDates, setDraftDates] = useState<SubstituteDateFilter[]>(dateFilters);
  const [draftRegions, setDraftRegions] = useState(selectedRegions);

  if (draftKey !== selectionKey) {
    setDraftKey(selectionKey);
    setDraftDates(dateFilters);
    setDraftRegions(selectedRegions);
  }

  const activeCount = dateFilters.length + selectedRegions.length;

  function apply(
    dates: SubstituteDateFilter[],
    regions: string[],
    analytics: {
      filterSource: "chip" | "sheet_apply" | "sheet_reset";
      filterKind: "date_all" | "date" | "region_combo" | "sheet_apply" | "sheet_reset";
      filterValue?: string;
      filterSelected: boolean;
    },
  ) {
    trackClickedListFilter({
      screen: "substitute_list",
      postKind: "substitute",
      sort,
      filterSource: analytics.filterSource,
      filterKind: analytics.filterKind,
      filterValue: analytics.filterValue,
      filterSelected: analytics.filterSelected,
      activeDateCount: dates.length,
      activeRegionCount: regions.length,
    });
    setFilterUrl(buildSubstituteFilterHref(dates, regions, sort));
  }

  const chips = [
    {
      key: "all-dates",
      label: "전체 일정",
      selected: dateFilters.length === 0,
      onSelect: () =>
        apply([], selectedRegions, {
          filterSource: "chip",
          filterKind: "date_all",
          filterSelected: true,
        }),
    },
    ...DATE_OPTIONS.map((option) => ({
      key: option.value,
      label: option.label,
      onSelect: () => {
        const nextDates = toggleValue(dateFilters, option.value);
        apply(nextDates, selectedRegions, {
          filterSource: "chip",
          filterKind: "date",
          filterValue: option.value,
          filterSelected: nextDates.includes(option.value),
        });
      },
      selected: dateFilters.includes(option.value),
    })),
    ...selectedRegions.map((region) => {
      const label = regionOptions.find(([value]) => value === region)?.[1] ?? region;
      return {
        key: `region-${region}`,
        label,
        onSelect: () =>
          apply(
            dateFilters,
            selectedRegions.filter((entry) => entry !== region),
            {
              filterSource: "chip",
              filterKind: "region_combo",
              filterValue: region,
              filterSelected: false,
            },
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
            apply(draftDates, draftRegions, {
              filterSource: "sheet_apply",
              filterKind: "sheet_apply",
              filterSelected: draftDates.length > 0 || draftRegions.length > 0,
            });
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
            <button
              type="button"
              data-close-sheet
              onClick={() =>
                apply([], [], {
                  filterSource: "sheet_reset",
                  filterKind: "sheet_reset",
                  filterSelected: false,
                })
              }
              className="flex-1 rounded-2xl border border-border px-4 py-3 text-center text-sm font-semibold text-muted-foreground"
            >
              초기화
            </button>
            <button
              type="submit"
              className="flex-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-background hover:opacity-90"
            >
              적용하기
            </button>
          </div>
        </form>
      }
    />
  );
}
