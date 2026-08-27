import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AmplitudeEventName,
  buildCreatedNotificationRuleProps,
  buildDeletedNotificationRuleProps,
  buildUpdatedNotificationPreferenceProps,
  compactAmplitudeProps,
} from "./amplitude-events";

test("production event names stay stable for dashboards", () => {
  assert.equal(AmplitudeEventName.ViewedJobDetail, "Viewed Job Detail");
  assert.equal(
    AmplitudeEventName.ViewedSubstituteDetail,
    "Viewed Substitute Detail",
  );
  assert.equal(AmplitudeEventName.ClickedDirectApply, "Clicked Direct Apply");
  assert.equal(AmplitudeEventName.ClickedSourceLink, "Clicked Source Link");
  assert.equal(AmplitudeEventName.ToggledBookmark, "Toggled Bookmark");
  assert.equal(
    AmplitudeEventName.CreatedNotificationRule,
    "Created Notification Rule",
  );
  assert.equal(
    AmplitudeEventName.UpdatedNotificationPreference,
    "Updated Notification Preference",
  );
  assert.equal(
    AmplitudeEventName.DeletedNotificationRule,
    "Deleted Notification Rule",
  );
});

test("compactAmplitudeProps drops empty values", () => {
  assert.deepEqual(
    compactAmplitudeProps({
      screen: "job_detail",
      post_id: "j1",
      organization_id: null,
      sido: "",
      has_direct_apply: false,
    }),
    {
      screen: "job_detail",
      post_id: "j1",
      has_direct_apply: false,
    },
  );
});

test("notification preference builders distinguish create, update, delete", () => {
  const preference = {
    enabled: true,
    rules: [
      {
        id: "r1",
        enabled: true,
        jobType: "regular" as const,
        sido: "서울",
        sigungu: "성북구",
        days: ["월"],
        timeSlots: [],
      },
      {
        id: "r2",
        enabled: false,
        jobType: "substitute" as const,
        sido: "서울",
        sigungu: "강남구",
        days: [],
        timeSlots: ["morning"],
      },
    ],
  };

  assert.deepEqual(
    buildCreatedNotificationRuleProps(preference, preference.rules[0]!),
    {
      screen: "notification_settings",
      notifications_enabled: true,
      notification_rule_count: 2,
      enabled_notification_rule_count: 1,
      has_regular_notification_rules: true,
      has_substitute_notification_rules: true,
      unique_notification_region_count: 2,
      rule_id: "r1",
      job_type: "regular",
    },
  );

  assert.deepEqual(
    buildUpdatedNotificationPreferenceProps(preference, "notification_rules", {
      updateKind: "rule_toggle",
      ruleId: "r2",
    }),
    {
      screen: "notification_rules",
      notifications_enabled: true,
      notification_rule_count: 2,
      enabled_notification_rule_count: 1,
      has_regular_notification_rules: true,
      has_substitute_notification_rules: true,
      unique_notification_region_count: 2,
      update_kind: "rule_toggle",
      rule_id: "r2",
    },
  );

  assert.deepEqual(
    buildDeletedNotificationRuleProps(
      { enabled: true, rules: [preference.rules[0]!] },
      preference.rules[1]!,
    ),
    {
      screen: "notification_rules",
      notifications_enabled: true,
      notification_rule_count: 1,
      enabled_notification_rule_count: 1,
      has_regular_notification_rules: true,
      has_substitute_notification_rules: false,
      unique_notification_region_count: 1,
      rule_id: "r2",
      job_type: "substitute",
    },
  );
});
