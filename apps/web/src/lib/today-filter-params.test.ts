import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildTodayHref,
  parseTodaySigungus,
  resolveTodayTab,
  toggleTodaySigungu,
} from "./today-filter-params";

test("resolveTodayTab defaults to jobs", () => {
  assert.equal(resolveTodayTab(undefined), "jobs");
  assert.equal(resolveTodayTab("jobs"), "jobs");
  assert.equal(resolveTodayTab("substitutes"), "substitutes");
});

test("parseTodaySigungus dedupes and trims", () => {
  assert.deepEqual(parseTodaySigungus(["강남구", " 강남구 ", "서초구"]), [
    "강남구",
    "서초구",
  ]);
});

test("buildTodayHref omits default tab and encodes sigungu", () => {
  assert.equal(buildTodayHref("jobs"), "/today");
  assert.equal(buildTodayHref("substitutes"), "/today?tab=substitutes");
  assert.equal(
    buildTodayHref("jobs", ["강남구", "서초구"]),
    "/today?sigungu=%EA%B0%95%EB%82%A8%EA%B5%AC&sigungu=%EC%84%9C%EC%B4%88%EA%B5%AC",
  );
});

test("toggleTodaySigungu adds and removes", () => {
  assert.deepEqual(toggleTodaySigungu([], "강남구"), ["강남구"]);
  assert.deepEqual(toggleTodaySigungu(["강남구"], "강남구"), []);
  assert.deepEqual(toggleTodaySigungu(["강남구"], "서초구"), ["강남구", "서초구"]);
});
