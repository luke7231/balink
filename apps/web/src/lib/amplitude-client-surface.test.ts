import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveAmplitudeClient } from "./amplitude-client-surface";

test("native shell is the Amplitude app client; everything else is web", () => {
  assert.equal(resolveAmplitudeClient(true), "app");
  assert.equal(resolveAmplitudeClient(false), "web");
});
