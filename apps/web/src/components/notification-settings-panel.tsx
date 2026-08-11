"use client";

import type { NotificationPreference } from "@balink/domain";
import { NotificationPreferenceForm } from "@/components/notification-preference-form";

type DistrictGroup = {
  sido: string;
  districts: readonly string[];
};

export function NotificationSettingsPanel({
  initialPreference,
  districtGroups,
  editRuleId,
}: {
  initialPreference: NotificationPreference;
  districtGroups: DistrictGroup[];
  editRuleId?: string;
}) {
  return (
    <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <NotificationPreferenceForm
        initialPreference={initialPreference}
        districtGroups={districtGroups}
        editRuleId={editRuleId}
        redirectOnSave="/notifications/rules"
      />
    </div>
  );
}
