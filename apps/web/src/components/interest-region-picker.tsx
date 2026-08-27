"use client";

import { useMemo, useState, useTransition } from "react";
import { formatSidoForDisplay } from "@balink/domain";
import {
  addInterestRegionAction,
  removeInterestRegionAction,
} from "@/components/account-actions";
import { FormError } from "@/components/form-error";
import { RegionLimitSheet } from "@/components/region-limit-sheet";
import {
  interestRegionKey,
  type InterestRegion,
} from "@/lib/interest-regions";

type DistrictGroup = {
  sido: string;
  districts: readonly string[];
};

export function InterestRegionPicker({
  initialRegions,
  districtGroups,
  regionReferred = false,
  onRegionsChange,
}: {
  initialRegions: InterestRegion[];
  districtGroups: DistrictGroup[];
  regionReferred?: boolean;
  onRegionsChange?: (regions: InterestRegion[]) => void;
}) {
  const [regions, setRegions] = useState(initialRegions);
  const [selectedSido, setSelectedSido] = useState(districtGroups[0]?.sido ?? "");
  const [error, setError] = useState<string | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function commitRegions(updater: (prev: InterestRegion[]) => InterestRegion[]) {
    setRegions((prev) => {
      const next = updater(prev);
      onRegionsChange?.(next);
      return next;
    });
  }

  const selectedKeys = useMemo(
    () => new Set(regions.map((region) => interestRegionKey(region.sido, region.sigungu))),
    [regions],
  );

  const currentDistricts =
    districtGroups.find((group) => group.sido === selectedSido)?.districts ?? [];

  function toggleRegion(sido: string, sigungu: string) {
    const key = interestRegionKey(sido, sigungu);
    const existing = regions.find(
      (region) => interestRegionKey(region.sido, region.sigungu) === key,
    );

    setError(null);
    startTransition(async () => {
      if (existing) {
        const result = await removeInterestRegionAction(existing.id);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        commitRegions((prev) => prev.filter((region) => region.id !== existing.id));
        return;
      }

      const result = await addInterestRegionAction(sido, sigungu);
      if (!result.ok) {
        setError(result.error);
        if (result.code === "REGION_LIMIT") setLimitOpen(true);
        return;
      }
      if (!result.region) return;

      const added = result.region;
      commitRegions((prev) =>
        [...prev.filter((region) => interestRegionKey(region.sido, region.sigungu) !== key), added].sort(
          (a, b) => `${a.sido}${a.sigungu}`.localeCompare(`${b.sido}${b.sigungu}`, "ko"),
        ),
      );
    });
  }

  function removeById(regionId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeInterestRegionAction(regionId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      commitRegions((prev) => prev.filter((region) => region.id !== regionId));
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-foreground">선택한 관심지역</p>
        {regions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground" role="status">
            아직 선택한 지역이 없어요.
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {regions.map((region) => (
              <li key={region.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => removeById(region.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent-border bg-accent-subtle px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-subtle disabled:opacity-60"
                >
                  {formatSidoForDisplay(region.sido)} {region.sigungu}
                  <span aria-hidden className="text-accent">
                    ×
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="interest-sido" className="text-sm font-medium text-foreground">
          시·도
        </label>
        <select
          id="interest-sido"
          value={selectedSido}
          onChange={(event) => setSelectedSido(event.target.value)}
          className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground"
        >
          {districtGroups.map((group) => (
            <option key={group.sido} value={group.sido}>
              {formatSidoForDisplay(group.sido)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground">시·군·구</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {regionReferred
            ? "기본은 두 곳까지입니다. 친구 한 명을 초대하면 무제한으로 열립니다."
            : "기본은 한 곳까지입니다. 코드를 넣으면 하나 더, 친구 한 명을 초대하면 무제한입니다."}
        </p>
        <div className="mt-3 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {currentDistricts.map((sigungu) => {
            const checked = selectedKeys.has(interestRegionKey(selectedSido, sigungu));
            return (
              <button
                key={sigungu}
                type="button"
                disabled={pending || !selectedSido}
                onClick={() => toggleRegion(selectedSido, sigungu)}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition disabled:opacity-60 ${
                  checked
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-surface text-foreground hover:border-accent-border hover:text-accent"
                }`}
              >
                {sigungu}
              </button>
            );
          })}
        </div>
      </div>

      {error ? <FormError>{error}</FormError> : null}
      <RegionLimitSheet
        open={limitOpen}
        referred={regionReferred}
        onClose={() => setLimitOpen(false)}
      />
    </div>
  );
}
