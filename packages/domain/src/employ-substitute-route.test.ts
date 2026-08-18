import assert from "node:assert/strict";
import { test } from "node:test";
import {
  classifyEmployJobType,
  isEmployBoardSourceUrl,
  isEmploySubstituteSourcePostId,
  shouldRouteEmployListingToSubstitute,
  toEmploySubstituteSourcePostId,
} from "./employ-substitute-route.js";

test("shouldRouteEmployListingToSubstitute only for substitute", () => {
  assert.equal(shouldRouteEmployListingToSubstitute("substitute"), true);
  assert.equal(shouldRouteEmployListingToSubstitute("one_time"), false);
  assert.equal(shouldRouteEmployListingToSubstitute("regular"), false);
  assert.equal(shouldRouteEmployListingToSubstitute(null), false);
});

test("classifyEmployJobType requires date cue for 당일/이번주", () => {
  assert.equal(classifyEmployJobType("대강 구합니다"), "substitute");
  assert.equal(classifyEmployJobType("대타 모집"), "substitute");
  assert.equal(classifyEmployJobType("당일 급구"), "regular");
  assert.equal(classifyEmployJobType("당일급 광명 7:10"), "regular");
  assert.equal(classifyEmployJobType("당일 8/19 대강"), "substitute");
  assert.equal(classifyEmployJobType("이번주 토요일 22일 양천구"), "substitute");
  assert.equal(classifyEmployJobType("이번주 함께할 강사"), "regular");
  assert.equal(classifyEmployJobType("특강 강사 모집"), "one_time");
  assert.equal(classifyEmployJobType("대타가 아닌 정규 강사"), "regular");
});

test("employ substitute sourcePostId prefix helpers", () => {
  assert.equal(toEmploySubstituteSourcePostId("87661"), "employ:87661");
  assert.equal(toEmploySubstituteSourcePostId("employ:87661"), "employ:87661");
  assert.equal(isEmploySubstituteSourcePostId("employ:87661"), true);
  assert.equal(isEmploySubstituteSourcePostId("87661"), false);
  assert.equal(isEmployBoardSourceUrl("https://www.balletmania.com/work/employ_detail.html?no=1"), true);
  assert.equal(isEmployBoardSourceUrl("https://www.balletmania.com/work/working_detail.html?no=1"), false);
});
