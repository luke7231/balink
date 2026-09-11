import assert from "node:assert/strict";
import { test } from "node:test";
import {
  effectivePostedAt,
  isInKstDayRange,
  kstDayRange,
  toKstDateString,
} from "./kst-day.js";

test("toKstDateString uses Asia/Seoul calendar day", () => {
  // 2026-09-10 15:30 UTC = 2026-09-11 00:30 KST
  assert.equal(toKstDateString(new Date("2026-09-10T15:30:00.000Z")), "2026-09-11");
  // 2026-09-10 14:59 UTC = 2026-09-10 23:59 KST
  assert.equal(toKstDateString(new Date("2026-09-10T14:59:00.000Z")), "2026-09-10");
});

test("kstDayRange covers KST midnight to next midnight", () => {
  const range = kstDayRange(new Date("2026-09-10T15:30:00.000Z"));
  assert.equal(range.date, "2026-09-11");
  assert.equal(range.start.toISOString(), "2026-09-10T15:00:00.000Z");
  assert.equal(range.end.toISOString(), "2026-09-11T15:00:00.000Z");
});

test("isInKstDayRange is half-open on the end", () => {
  const range = kstDayRange(new Date("2026-09-10T15:30:00.000Z"));
  assert.equal(isInKstDayRange(range.start, range), true);
  assert.equal(isInKstDayRange(new Date(range.end.getTime() - 1), range), true);
  assert.equal(isInKstDayRange(range.end, range), false);
});

test("effectivePostedAt falls back to createdAt", () => {
  const createdAt = new Date("2026-09-11T01:00:00.000Z");
  const postedAt = new Date("2026-09-10T01:00:00.000Z");
  assert.equal(effectivePostedAt(postedAt, createdAt), postedAt);
  assert.equal(effectivePostedAt(null, createdAt), createdAt);
  assert.equal(effectivePostedAt(undefined, createdAt), createdAt);
});
