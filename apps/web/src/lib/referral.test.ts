import assert from "node:assert/strict";
import { test } from "node:test";
import {
  exceedsFreeInterestRegionLimit,
  normalizeReferralCode,
  uniqueInterestRegionCount,
} from "@balink/domain";

test("plain users start at one region, a friend code raises it to two", () => {
  assert.equal(normalizeReferralCode("xk4m2p7b"), "XK4M2P7B");
  assert.equal(
    uniqueInterestRegionCount([
      { sido: "서울특별시", sigungu: "성동구" },
      { sido: "경기도", sigungu: "성남시" },
    ]),
    2,
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
      unlocked: true,
      referred: true,
      currentUniqueCount: 2,
      nextUniqueCount: 3,
    }),
    false,
  );
});
