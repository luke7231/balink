import assert from "node:assert/strict";
import test from "node:test";
import { isAppleLoginEnabled, isEmailAuthEnabled } from "./auth-features";

test("email auth is on locally and on preview, off in production", () => {
  assert.equal(isEmailAuthEnabled(undefined), true);
  assert.equal(isEmailAuthEnabled("development"), true);
  assert.equal(isEmailAuthEnabled("preview"), true);
  assert.equal(isEmailAuthEnabled("production"), false);
});

test("Apple login stays hidden", () => {
  assert.equal(isAppleLoginEnabled(), false);
});
