import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AmplitudeEventName,
  buildSavedNotificationPreferenceProps,
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
    AmplitudeEventName.SavedNotificationPreference,
    "Saved Notification Preference",
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

test("buildSavedNotificationPreferenceProps summarizes rules", () => {
  assert.deepEqual(
    buildSavedNotificationPreferenceProps(
      {
        enabled: true,
        rules: [
          {
            id: "r1",
            enabled: true,
            jobType: "regular",
            sido: "서울",
            sigungu: "성북구",
            days: ["월"],
            timeSlots: [],
          },
          {
            id: "r2",
            enabled: false,
            jobType: "substitute",
            sido: "서울",
            sigungu: "강남구",
            days: [],
            timeSlots: ["morning"],
          },
        ],
      },
      "notification_settings",
    ),
    {
      screen: "notification_settings",
      notifications_enabled: true,
      notification_rule_count: 2,
      enabled_notification_rule_count: 1,
      has_regular_notification_rules: true,
      has_substitute_notification_rules: true,
      unique_notification_region_count: 2,
    },
  );
});
