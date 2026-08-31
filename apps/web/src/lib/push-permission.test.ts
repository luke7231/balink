import assert from "node:assert/strict";
import test from "node:test";
import { getPushPermissionAction } from "./push-permission";

test("permission CTA covers granted, requestable, denied and unavailable states", () => {
  assert.equal(getPushPermissionAction("granted", true), null);
  assert.equal(getPushPermissionAction("undetermined", true), "request");
  assert.equal(getPushPermissionAction("undetermined", false), "settings");
  // Android first launch: denied + canAskAgain → still show the system prompt.
  assert.equal(getPushPermissionAction("denied", true), "request");
  assert.equal(getPushPermissionAction("denied", false), "settings");
  assert.equal(getPushPermissionAction("unavailable", false), null);
});
