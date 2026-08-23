import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyCopy, errorCopy, notificationCopy } from "./ui-copy";

test("empty and notification copy stay in ~어요 voice", () => {
  for (const block of Object.values(emptyCopy)) {
    assert.match(block.title, /어요$/);
  }
  assert.match(emptyCopy.notificationRules.inline, /없어요$/);
  assert.equal(notificationCopy.rulesTitle, "알림 조건");
  assert.doesNotMatch(notificationCopy.rulesHelp, /규칙/);
});

test("shared retry and not-found errors stay consistent", () => {
  assert.match(errorCopy.retrySoon, /다시 시도해 주세요/);
  assert.match(errorCopy.jobNotFound, /없어요/);
  assert.match(errorCopy.substituteNotFound, /없어요/);
  assert.match(errorCopy.loadMoreSubstitutes, /대강/);
});
