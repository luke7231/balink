import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSubstituteFilterHref,
  parseSubstituteDateFilters,
  parseSubstituteFilterSearchParams,
} from "./substitute-filter-params";
import { parseSubstituteSort } from "./list-sort";

test("parseSubstituteDateFilters keeps only known values", () => {
  assert.deepEqual(parseSubstituteDateFilters(["today", "nope", "week"]), ["today", "week"]);
});

test("parseSubstituteSort falls back to latest", () => {
  assert.equal(parseSubstituteSort("latest"), "latest");
  assert.equal(parseSubstituteSort("soon"), "soon");
  assert.equal(parseSubstituteSort("nope"), "latest");
});

test("buildSubstituteFilterHref omits default sort", () => {
  assert.equal(buildSubstituteFilterHref([], []), "/substitutes");
  assert.equal(
    buildSubstituteFilterHref(["today"], ["서울::강남구"]),
    "/substitutes?date=today&region=%EC%84%9C%EC%9A%B8%3A%3A%EA%B0%95%EB%82%A8%EA%B5%AC",
  );
  assert.equal(
    buildSubstituteFilterHref([], [], "soon"),
    "/substitutes?sort=soon",
  );
  assert.equal(buildSubstituteFilterHref(["today"], [], "latest"), "/substitutes?date=today");
});

test("parseSubstituteFilterSearchParams reads date region sort", () => {
  const params = new URLSearchParams("date=today&region=서울::강남구&sort=soon");
  assert.deepEqual(parseSubstituteFilterSearchParams(params), {
    dateFilters: ["today"],
    selectedRegions: ["서울::강남구"],
    sort: "soon",
  });
});
