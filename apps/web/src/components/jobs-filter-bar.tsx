"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  selectedSido: string;
  selectedSigungu: string;
}

function buildJobsHref(sido?: string, sigungu?: string): string {
  const params = new URLSearchParams();
  if (sido) params.set("sido", sido);
  if (sigungu) params.set("sigungu", sigungu);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function JobsFilterBar({ regions, selectedSido, selectedSigungu }: JobsFilterBarProps) {
  const router = useRouter();
  const [draftSido, setDraftSido] = useState(selectedSido);
  const [draftSigungu, setDraftSigungu] = useState(selectedSigungu);

  useEffect(() => {
    setDraftSido(selectedSido);
    setDraftSigungu(selectedSigungu);
  }, [selectedSido, selectedSigungu]);

  const districts = useMemo(
    () => regions.find((region) => region.sido === draftSido)?.districts ?? [],
    [regions, draftSido],
  );

  const activeCount = Number(Boolean(selectedSido)) + Number(Boolean(selectedSigungu));

  const chips = [
    {
      key: "all",
      label: "전체 지역",
      href: "/",
      selected: !selectedSido,
    },
    ...regions.map((region) => ({
      key: region.sido,
      label: region.sido,
      href: buildJobsHref(region.sido),
      selected: selectedSido === region.sido,
    })),
    ...(selectedSigungu
      ? [
          {
            key: `sigungu-${selectedSigungu}`,
            label: selectedSigungu,
            href: buildJobsHref(selectedSido, selectedSigungu),
            selected: true,
          },
        ]
      : []),
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
            router.push(buildJobsHref(draftSido || undefined, draftSigungu || undefined));
          }}
        >
          <div>
            <p className="mb-2 text-sm font-semibold text-zinc-800">시·도</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraftSido("");
                  setDraftSigungu("");
                }}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                  !draftSido ? "bg-rose-50 text-rose-700" : "border border-zinc-200 text-zinc-600"
                }`}
              >
                전체
              </button>
              {regions.map((region) => (
                <button
                  key={region.sido}
                  type="button"
                  onClick={() => {
                    setDraftSido(region.sido);
                    setDraftSigungu("");
                  }}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                    draftSido === region.sido
                      ? "bg-rose-50 text-rose-700"
                      : "border border-zinc-200 text-zinc-600"
                  }`}
                >
                  {region.sido}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-800" htmlFor="jobs-sheet-sigungu">
              시·군·구
            </label>
            <select
              id="jobs-sheet-sigungu"
              value={draftSigungu}
              disabled={!draftSido}
              onChange={(event) => setDraftSigungu(event.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 disabled:bg-zinc-50 disabled:text-zinc-400"
            >
              <option value="">{draftSido ? `${draftSido} 전체` : "시·도를 먼저 선택"}</option>
              {districts.map((district) => (
                <option key={district.sigungu} value={district.sigungu}>
                  {district.sigungu} ({district.count})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Link
              href="/"
              className="flex-1 rounded-2xl border border-zinc-200 px-4 py-3 text-center text-sm font-semibold text-zinc-600"
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
