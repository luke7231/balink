import assert from "node:assert/strict";
import test from "node:test";
import { buildJobsFilterHref, parseJobFilterParams, toParamList } from "./job-filter-params";

test("toParamList splits comma lists and trims", () => {
  assert.deepEqual(toParamList("서울특별시, 경기도"), ["서울특별시", "경기도"]);
  assert.deepEqual(toParamList(["강남구", " 송파구 "]), ["강남구", "송파구"]);
  assert.deepEqual(toParamList(undefined), []);
});

test("parseJobFilterParams prefers sido/sigungu over legacy region", () => {
  assert.deepEqual(
    parseJobFilterParams({ sido: "서울특별시", sigungu: "강남구" }),
    { selectedSidos: ["서울특별시"], selectedSigungus: ["강남구"] },
  );
  assert.deepEqual(
    parseJobFilterParams({ region: "서울특별시::강남구" }),
    { selectedSidos: ["서울특별시"], selectedSigungus: ["강남구"] },
  );
});

test("buildJobsFilterHref omits empty query", () => {
  assert.equal(buildJobsFilterHref([], []), "/");
  assert.equal(
    buildJobsFilterHref(["서울특별시"], ["강남구"]),
    "/?sido=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C&sigungu=%EA%B0%95%EB%82%A8%EA%B5%AC",
  );
});
