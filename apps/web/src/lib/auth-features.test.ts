import assert from "node:assert/strict";
import test from "node:test";
import { isAppleLoginEnabled } from "./auth-features";

test("Apple login stays hidden", () => {
  assert.equal(isAppleLoginEnabled(), false);
});
