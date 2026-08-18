"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FilterChipBar } from "@/components/filter-chip-bar";

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
}

function buildJobsHref(sidos: string[], sigungus: string[]): string {
  const params = new URLSearchParams();
  for (const sido of sidos) params.append("sido", sido);
  for (const sigungu of sigungus) params.append("sigungu", sigungu);
  const query = params.toString();
  return query ? `/?${query}` : "/";
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

export function JobsFilterBar({ regions, selectedSidos, selectedSigungus }: JobsFilterBarProps) {
  const router = useRouter();
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

  const chips = [
    {
      key: "all",
      label: "전체 지역",
      href: "/",
      selected: selectedSidos.length === 0 && selectedSigungus.length === 0,
    },
    ...regions.map((region) => {
      const hasDistrictSelection = region.districts.some((district) =>
        selectedSigungus.includes(district.sigungu),
      );
      return {
        key: region.sido,
        label: region.sido,
        href: buildJobsHref(
          toggleValue(selectedSidos, region.sido),
          selectedSidos.includes(region.sido)
            ? selectedSigungus.filter(
                (sigungu) => !region.districts.some((district) => district.sigungu === sigungu),
              )
            : selectedSigungus,
        ),
        // 구가 선택된 시·도는 "시 전체" 칩으로 강조하지 않는다.
        selected: selectedSidos.includes(region.sido) && !hasDistrictSelection,
      };
    }),
    ...selectedSigungus.map((sigungu) => ({
      key: `sigungu-${sigungu}`,
      label: sigungu,
      href: buildJobsHref(
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
            router.push(buildJobsHref(draftSidos, draftSigungus));
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
            <Link
              href="/"
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
