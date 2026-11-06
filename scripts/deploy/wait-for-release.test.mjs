import assert from "node:assert/strict";
import { test } from "node:test";
import { waitForRelease } from "./wait-for-release.mjs";

const url = "https://example.test/health";
const response = (ok, revision, healthy = true) => ({ ok, json: async () => ({ ok: healthy, revision }) });

test("waits past network errors, old releases and unhealthy new releases", async () => {
  const replies = [new Error("building"), response(true, "old"), response(false, "new"), response(true, "new", false), response(true, "new")];
  let requests = 0;
  let ticks = 0;
  await waitForRelease(url, "new", {
    fetchHealth: async () => {
      requests++;
      const reply = replies.shift();
      if (reply instanceof Error) throw reply;
      return reply;
    },
    now: () => ticks,
    sleep: async () => { ticks++; },
    timeoutMs: 10,
  });
  assert.equal(requests, 5);
});

test("an old healthy container cannot satisfy deployment verification", async () => {
  let ticks = 0;
  await assert.rejects(waitForRelease(url, "new", {
    fetchHealth: async () => response(true, "old"),
    now: () => ticks,
    sleep: async () => { ticks++; },
    timeoutMs: 2,
  }), /timeout/);
});
