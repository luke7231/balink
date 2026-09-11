"use client";

import Link from "next/link";
import { trackClickedListFilter } from "@/lib/amplitude-list-filter";
import {
  buildTodayHref,
  toggleTodaySigungu,
  type TodayTab,
} from "@/lib/today-filter-params";
import type { TodaySigunguChip } from "@/lib/today-posts";

export function TodaySigunguChips({
  tab,
  chips,
  selected,
}: {
  tab: TodayTab;
  chips: TodaySigunguChip[];
  selected: string[];
}) {
  if (chips.length === 0) return null;

  const postKind = tab === "jobs" ? "job" : "substitute";

  return (
    <section aria-label="지역 필터" className="mb-5 min-w-0 max-w-full">
      <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-1 scrollbar-none">
        {chips.map((chip) => {
          const isSelected = selected.includes(chip.sigungu);
          const next = toggleTodaySigungu(selected, chip.sigungu);
          return (
            <Link
              key={chip.sigungu}
              href={buildTodayHref(tab, next)}
              scroll={false}
              aria-pressed={isSelected}
              onClick={() => {
                trackClickedListFilter({
                  screen: "today_list",
                  postKind,
                  sort: "latest",
                  filterSource: "chip",
                  filterKind: "region_sigungu",
                  filterValue: chip.sigungu,
                  filterSelected: !isSelected,
                  activeSigunguCount: next.length,
                });
              }}
              className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold whitespace-nowrap transition ${
                isSelected
                  ? "bg-accent-subtle text-accent"
                  : "border border-border bg-surface text-muted-foreground"
              }`}
            >
              <span>{chip.sigungu}</span>
              <span className="tabular-nums font-medium opacity-80">{chip.count}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
