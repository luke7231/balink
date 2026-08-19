"use client";

import { useMemo, useState } from "react";
import { FilterChipBar } from "@/components/filter-chip-bar";
import { setFilterUrl } from "@/lib/filter-url";
import { buildJobsFilterHref } from "@/lib/job-filter-params";
import type { JobSort } from "@/lib/list-sort";

interface DistrictOption {
  sigungu: string;
  count: number;
}

interface RegionOption {
  sido: string;
  count: number;
  districts: DistrictOption[];
}

interface JobsFilterBarProps {
  regions: RegionOption[];
  selectedSidos: string[];
  selectedSigungus: string[];
  sort: JobSort;
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

function optionClass(selected: boolean): string {
  return `rounded-xl px-3 py-2 text-sm font-semibold transition ${
    selected
      ? "bg-accent-subtle text-accent"
      : "border border-border text-muted-foreground"
  }`;
}

export function JobsFilterBar({
  regions,
  selectedSidos,
  selectedSigungus,
  sort,
}: JobsFilterBarProps) {
  const selectionKey = `${selectedSidos.join("\0")}|${selectedSigungus.join("\0")}`;
  const [draftKey, setDraftKey] = useState(selectionKey);
  const [draftSidos, setDraftSidos] = useState(selectedSidos);
  const [draftSigungus, setDraftSigungus] = useState(selectedSigungus);

  if (draftKey !== selectionKey) {
    setDraftKey(selectionKey);
    setDraftSidos(selectedSidos);
    setDraftSigungus(selectedSigungus);
  }

  const districts = useMemo(() => {
    const selected = new Set(draftSidos);
    return regions
      .filter((region) => selected.has(region.sido))
      .flatMap((region) =>
        region.districts.map((district) => ({
          ...district,
          sido: region.sido,
        })),
      );
  }, [regions, draftSidos]);

  const activeCount =
    selectedSidos.filter((sido) => {
      const region = regions.find((entry) => entry.sido === sido);
      if (!region) return true;
      return !region.districts.some((district) => selectedSigungus.includes(district.sigungu));
    }).length + selectedSigungus.length;

  function apply(sidos: string[], sigungus: string[]) {
    setFilterUrl(buildJobsFilterHref(sidos, sigungus, sort));
  }

  const chips = [
    {
      key: "all",
      label: "전체 지역",
      selected: selectedSidos.length === 0 && selectedSigungus.length === 0,
      onSelect: () => apply([], []),
    },
    ...regions.map((region) => {
      const hasDistrictSelection = region.districts.some((district) =>
        selectedSigungus.includes(district.sigungu),
      );
      return {
        key: region.sido,
        label: region.sido,
        onSelect: () =>
          apply(
            toggleValue(selectedSidos, region.sido),
            selectedSidos.includes(region.sido)
              ? selectedSigungus.filter(
                  (sigungu) => !region.districts.some((district) => district.sigungu === sigungu),
                )
              : selectedSigungus,
          ),
        selected: selectedSidos.includes(region.sido) && !hasDistrictSelection,
      };
    }),
    ...selectedSigungus.map((sigungu) => ({
      key: `sigungu-${sigungu}`,
      label: sigungu,
      onSelect: () =>
        apply(
          selectedSidos,
          selectedSigungus.filter((entry) => entry !== sigungu),
        ),
      selected: true,
    })),
  ];

  return (
    <FilterChipBar
      ariaLabel="채용 공고 필터"
      activeCount={activeCount}
      sheetTitle="지역 필터"
      chips={chips}
      sheetContent={
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            apply(draftSidos, draftSigungus);
          }}
        >
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">시·도</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraftSidos([]);
                  setDraftSigungus([]);
                }}
                className={optionClass(draftSidos.length === 0)}
              >
                전체
              </button>
              {regions.map((region) => {
                const selected = draftSidos.includes(region.sido);
                return (
                  <button
                    key={region.sido}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      const removing = draftSidos.includes(region.sido);
                      setDraftSidos((prev) => toggleValue(prev, region.sido));
                      if (removing) {
                        const removed = new Set(region.districts.map((district) => district.sigungu));
                        setDraftSigungus((current) =>
                          current.filter((sigungu) => !removed.has(sigungu)),
                        );
                      }
                    }}
                    className={optionClass(selected)}
                  >
                    {region.sido}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">시·군·구</p>
            {draftSidos.length === 0 ? (
              <p className="text-sm text-muted-foreground">시·도를 먼저 선택해 주세요.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {districts.map((district) => {
                  const selected = draftSigungus.includes(district.sigungu);
                  return (
                    <button
                      key={`${district.sido}-${district.sigungu}`}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setDraftSigungus((prev) => toggleValue(prev, district.sigungu))
                      }
                      className={optionClass(selected)}
                    >
                      {district.sigungu}
                      <span className="ml-1 text-xs font-medium opacity-70">({district.count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              data-close-sheet
              onClick={() => apply([], [])}
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
