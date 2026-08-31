import assert from "node:assert/strict";
import test from "node:test";
import { isAppleLoginEnabled, isAppleLoginVisibleOnDevice } from "./auth-features";
import { parseUserAgent } from "./device";

test("Apple login is enabled for App Store review", () => {
  assert.equal(isAppleLoginEnabled(), true);
});

test("Apple login is hidden on Android and shown on iPhone and desktop", () => {
  const galaxy = parseUserAgent(
    "Mozilla/5.0 (Linux; Android 14; SM-S918N; wv) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
  );
  const iphone = parseUserAgent(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  );
  const desktop = parseUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );

  assert.equal(isAppleLoginVisibleOnDevice(galaxy), false);
  assert.equal(isAppleLoginVisibleOnDevice(iphone), true);
  assert.equal(isAppleLoginVisibleOnDevice(desktop), true);
});
