"use client";

import { useState } from "react";
import type { NotificationPreference } from "@black-swan/domain";
import { InterestRegionPicker } from "@/components/interest-region-picker";
import { NotificationPreferenceForm } from "@/components/notification-preference-form";
import type { InterestRegion } from "@/lib/interest-regions";

type DistrictGroup = {
  sido: string;
  districts: readonly string[];
};

export function NotificationSettingsPanel({
  initialRegions,
  districtGroups,
  initialPreference,
}: {
  initialRegions: InterestRegion[];
  districtGroups: DistrictGroup[];
  initialPreference: NotificationPreference;
}) {
  const [regions, setRegions] = useState(initialRegions);

  return (
    <ol className="mt-6 space-y-4">
      <li className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
            1
          </span>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">어디서</h2>
            <p className="text-xs text-zinc-500">
              관심 있는 지역을 골라 주세요. 여러 곳이면 그중 하나라도 맞으면 됩니다.
            </p>
          </div>
        </div>
        <InterestRegionPicker
          initialRegions={initialRegions}
          districtGroups={districtGroups}
          onRegionsChange={setRegions}
        />
      </li>

      <li className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
            2
          </span>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">어떤 공고 · 언제</h2>
            <p className="text-xs text-zinc-500">
              정규·대타별로 조건을 여러 개 둘 수 있고, 하나라도 맞으면 알림이 옵니다.
            </p>
          </div>
        </div>
        <NotificationPreferenceForm
          initialPreference={initialPreference}
          interestRegions={regions}
        />
      </li>
    </ol>
  );
}
