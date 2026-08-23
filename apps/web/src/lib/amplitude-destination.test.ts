import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resolveAmplitudeApiKey,
  resolveAmplitudeAppEnv,
} from "./amplitude-destination";

test("local and preview stay on the Amplitude dev project", () => {
  assert.equal(resolveAmplitudeAppEnv(undefined), "dev");
  assert.equal(resolveAmplitudeAppEnv("development"), "dev");
  assert.equal(resolveAmplitudeAppEnv("preview"), "dev");
  assert.equal(resolveAmplitudeAppEnv("production"), "prd");
});

test("each Amplitude app env uses its own key", () => {
  assert.deepEqual(
    resolveAmplitudeApiKey({
      vercelEnv: undefined,
      devApiKey: "dev-key",
      prdApiKey: "prd-key",
    }),
    { env: "dev", apiKey: "dev-key" },
  );
  assert.deepEqual(
    resolveAmplitudeApiKey({
      vercelEnv: "production",
      devApiKey: "dev-key",
      prdApiKey: "prd-key",
    }),
    { env: "prd", apiKey: "prd-key" },
  );
  assert.equal(
    resolveAmplitudeApiKey({
      vercelEnv: undefined,
      devApiKey: "  ",
      prdApiKey: "prd-key",
    }).apiKey,
    undefined,
  );
});
