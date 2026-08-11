"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FilterChipBar } from "@/components/filter-chip-bar";

type DateFilter = "all" | "today" | "tomorrow" | "week";

interface SubstitutesFilterBarProps {
  dateFilter: DateFilter;
  selectedRegion: string;
  regionOptions: Array<[string, string]>;
}

const DATE_OPTIONS: Array<{ value: DateFilter; label: string }> = [
  { value: "all", label: "전체 일정" },
  { value: "today", label: "오늘" },
  { value: "tomorrow", label: "내일" },
  { value: "week", label: "7일 이내" },
];

function buildFilterHref(dateFilter: DateFilter, region: string): string {
  const params = new URLSearchParams();
  if (dateFilter !== "all") params.set("date", dateFilter);
  if (region) params.set("region", region);
  const query = params.toString();
  return query ? `/substitutes?${query}` : "/substitutes";
}

export function SubstitutesFilterBar({
  dateFilter,
  selectedRegion,
  regionOptions,
}: SubstitutesFilterBarProps) {
  const router = useRouter();
  const [draftDate, setDraftDate] = useState<DateFilter>(dateFilter);
  const [draftRegion, setDraftRegion] = useState(selectedRegion);

  useEffect(() => {
    setDraftDate(dateFilter);
    setDraftRegion(selectedRegion);
  }, [dateFilter, selectedRegion]);

  const activeCount = Number(dateFilter !== "all") + Number(Boolean(selectedRegion));

  const chips = DATE_OPTIONS.map((option) => ({
    key: option.value,
    label: option.label,
    href: buildFilterHref(option.value, selectedRegion),
    selected: dateFilter === option.value,
  }));

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
            router.push(buildFilterHref(draftDate, draftRegion));
          }}
        >
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">일정</p>
            <div className="flex flex-wrap gap-2">
              {DATE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDraftDate(option.value)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                    draftDate === option.value
                      ? "bg-accent-subtle text-accent"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground" htmlFor="substitutes-sheet-region">
              지역
            </label>
            <select
              id="substitutes-sheet-region"
              value={draftRegion}
              onChange={(event) => setDraftRegion(event.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            >
              <option value="">전체 지역</option>
              {regionOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
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
