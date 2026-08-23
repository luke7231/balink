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
  regionUnlocked = false,
  regionReferred = false,
}: {
  initialPreference: NotificationPreference;
  districtGroups: DistrictGroup[];
  editRuleId?: string;
  regionUnlocked?: boolean;
  regionReferred?: boolean;
}) {
  return (
    <div className="mt-6 rounded-3xl border border-border bg-surface p-5 shadow-sm">
      <NotificationPreferenceForm
        initialPreference={initialPreference}
        districtGroups={districtGroups}
        editRuleId={editRuleId}
        redirectOnSave="/notifications/rules"
        regionUnlocked={regionUnlocked}
        regionReferred={regionReferred}
      />
    </div>
  );
}
