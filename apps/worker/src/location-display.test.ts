import assert from "node:assert/strict";
import test from "node:test";
import {
  formatAdminLocationDisplay,
  formatLocation,
  isAcademyOnlyLocationText,
  sanitizeLocationTextForStorage,
} from "@black-swan/domain";

test("formatAdminLocationDisplay uses shortened metro labels", () => {
  assert.equal(formatAdminLocationDisplay("서울특별시", "성북구"), "서울 성북구");
  assert.equal(formatAdminLocationDisplay("경기도", "남양주시", "별내동"), "경기도 남양주시 별내동");
  assert.equal(formatAdminLocationDisplay("경기도", "용인시", "구갈동"), "경기도 용인시 구갈동");
});

test("formatLocation never shows academy names", () => {
  assert.equal(formatLocation("서울특별시", "강동구", null), "서울 강동구");
  assert.equal(formatLocation(null, null, null), "지역 미상");
});

test("sanitizeLocationTextForStorage drops academy-only raw text", () => {
  assert.equal(sanitizeLocationTextForStorage("블랙스완 발레학원", null, null, null), null);
  assert.equal(
    sanitizeLocationTextForStorage("블랙스완 발레학원", "경기도", "용인시", "구갈동"),
    "경기도 용인시 구갈동",
  );
});

test("isAcademyOnlyLocationText detects academy names without admin districts", () => {
  assert.equal(isAcademyOnlyLocationText("000발레학원"), true);
  assert.equal(isAcademyOnlyLocationText("서울 강남구"), false);
});
