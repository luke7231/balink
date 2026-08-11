import assert from "node:assert/strict";
import test from "node:test";
import { buildKakaoQuery, looksLikeAcademyOnly } from "./location-geocoder.js";
import { getListingPostId } from "./incremental-listings.js";

test("getListingPostId resolves source-specific keys", () => {
  assert.equal(getListingPostId("esangdance", { postId: "123" }), "123");
  assert.equal(getListingPostId("balletmania", { no: "87437" }), "87437");
});

test("looksLikeAcademyOnly detects academy-only location text", () => {
  assert.equal(looksLikeAcademyOnly("발링크 발레학원"), true);
  assert.equal(looksLikeAcademyOnly("서울 강남구"), false);
});

test("buildKakaoQuery combines academy and region hint", () => {
  assert.equal(
    buildKakaoQuery({
      title: "강사 구합니다",
      description: "",
      company: "발링크 발레",
      locationText: "서울 강남구",
      parsedSido: null,
      parsedSigungu: null,
      parsedDongOrStation: null,
      parsedConfidence: "low",
    }),
    "발링크 발레 서울 강남구",
  );
});
