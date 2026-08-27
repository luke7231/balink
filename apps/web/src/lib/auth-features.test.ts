import assert from "node:assert/strict";
import test from "node:test";
import { isAppleLoginEnabled } from "./auth-features";

test("Apple login is enabled for App Store review", () => {
  assert.equal(isAppleLoginEnabled(), true);
});
