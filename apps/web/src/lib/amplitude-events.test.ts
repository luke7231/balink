import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AmplitudeEventName,
  compactAmplitudeProps,
} from "./amplitude-events";

test("production event names stay stable for dashboards", () => {
  assert.equal(AmplitudeEventName.ViewedHomePage, "Viewed Home Page");
  assert.equal(AmplitudeEventName.ViewedJobDetail, "Viewed Job Detail");
  assert.equal(
    AmplitudeEventName.ViewedSubstituteDetail,
    "Viewed Substitute Detail",
  );
  assert.equal(AmplitudeEventName.ClickedDirectApply, "Clicked Direct Apply");
  assert.equal(AmplitudeEventName.ClickedSourceLink, "Clicked Source Link");
  assert.equal(AmplitudeEventName.ToggledBookmark, "Toggled Bookmark");
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
