import assert from "node:assert/strict";
import test from "node:test";
import { buildRegionFilterClauses } from "./region-filter.js";

test("sido only matches the whole city", () => {
  assert.deepEqual(buildRegionFilterClauses(["서울특별시"], []), [{ sido: "서울특별시" }]);
});

test("sido with district does not OR bare sido", () => {
  assert.deepEqual(buildRegionFilterClauses(["서울특별시"], ["성북구"]), [
    { sido: "서울특별시", sigungu: "성북구" },
  ]);
});

test("multiple districts under one sido become OR-able pairs", () => {
  const clauses = buildRegionFilterClauses(["서울특별시"], ["강남구", "성북구"]);
  assert.equal(clauses.length, 2);
  assert.deepEqual(
    new Set(clauses.map((clause) => `${clause.sido}|${clause.sigungu}`)),
    new Set(["서울특별시|강남구", "서울특별시|성북구"]),
  );
});

test("whole sido plus another city's district stay separate clauses", () => {
  assert.deepEqual(buildRegionFilterClauses(["서울특별시", "경기도"], ["성남시"]), [
    { sido: "서울특별시" },
    { sido: "경기도", sigungu: "성남시" },
  ]);
});

test("orphan sigungu pairs with known parent sido", () => {
  assert.deepEqual(buildRegionFilterClauses([], ["성북구"]), [
    { sido: "서울특별시", sigungu: "성북구" },
  ]);
});
