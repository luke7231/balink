import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BASE_INTEREST_REGION_LIMIT,
  MAX_INTEREST_REGIONS,
  REFERRED_INTEREST_REGION_LIMIT,
  exceedsFreeInterestRegionLimit,
  uniqueInterestRegionCount,
} from "./interest-region-limit.js";

test("unique count ignores blank and duplicates", () => {
  assert.equal(uniqueInterestRegionCount([]), 0);
  assert.equal(
    uniqueInterestRegionCount([
      { sido: "서울특별시", sigungu: "강남구" },
      { sido: "서울특별시", sigungu: "강남구" },
      { sido: "서울특별시", sigungu: "" },
      { sido: "", sigungu: "서초구" },
      { sido: "서울특별시", sigungu: "서초구" },
    ]),
    2,
  );
});

test("plain users start with one region", () => {
  assert.equal(BASE_INTEREST_REGION_LIMIT, 1);
  assert.equal(
    exceedsFreeInterestRegionLimit({
      unlocked: false,
      referred: false,
      currentUniqueCount: 0,
      nextUniqueCount: 1,
    }),
    false,
  );
  assert.equal(
    exceedsFreeInterestRegionLimit({
      unlocked: false,
      referred: false,
      currentUniqueCount: 1,
      nextUniqueCount: 2,
    }),
    true,
  );
});

test("entering a friend code raises the cap to two", () => {
  assert.equal(REFERRED_INTEREST_REGION_LIMIT, 2);
  assert.equal(
    exceedsFreeInterestRegionLimit({
      unlocked: false,
      referred: true,
      currentUniqueCount: 1,
      nextUniqueCount: 2,
    }),
    false,
  );
  assert.equal(
    exceedsFreeInterestRegionLimit({
      unlocked: false,
      referred: true,
      currentUniqueCount: 2,
      nextUniqueCount: 3,
    }),
    true,
  );
});

test("legacy users above the free limit can keep current regions", () => {
  assert.equal(
    exceedsFreeInterestRegionLimit({
      unlocked: false,
      referred: false,
      currentUniqueCount: 4,
      nextUniqueCount: 4,
    }),
    false,
  );
  assert.equal(
    exceedsFreeInterestRegionLimit({
      unlocked: false,
      referred: false,
      currentUniqueCount: 4,
      nextUniqueCount: 5,
    }),
    true,
  );
});

test("unlocked users are only stopped by the hard cap", () => {
  assert.equal(
    exceedsFreeInterestRegionLimit({
      unlocked: true,
      referred: false,
      currentUniqueCount: 2,
      nextUniqueCount: 8,
    }),
    false,
  );
  assert.equal(
    exceedsFreeInterestRegionLimit({
      unlocked: true,
      referred: true,
      currentUniqueCount: MAX_INTEREST_REGIONS,
      nextUniqueCount: MAX_INTEREST_REGIONS + 1,
    }),
    true,
  );
});
