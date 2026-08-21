import assert from "node:assert/strict";
import { test } from "node:test";
import { canonicalizeAdminRegion, listAdminDistrictGroups } from "./admin-districts.js";

test("listAdminDistrictGroups pins Seoul and Gyeonggi first", () => {
  const groups = listAdminDistrictGroups();
  assert.equal(groups[0]?.sido, "서울특별시");
  assert.equal(groups[1]?.sido, "경기도");
});

test("canonicalizeAdminRegion expands short sido aliases", () => {
  assert.deepEqual(
    canonicalizeAdminRegion({
      sido: "서울",
      sigungu: "도봉구",
      dongOrStation: "쌍문역",
    }),
    {
      sido: "서울특별시",
      sigungu: "도봉구",
      dongOrStation: "쌍문역",
      changed: true,
    },
  );

  assert.deepEqual(
    canonicalizeAdminRegion({
      sido: "경기",
      sigungu: "고양시 일산구",
      dongOrStation: "주엽역",
    }),
    {
      sido: "경기도",
      sigungu: "고양시 일산구",
      dongOrStation: "주엽역",
      changed: true,
    },
  );

  assert.deepEqual(
    canonicalizeAdminRegion({
      sido: "인천",
      sigungu: "부평구",
      dongOrStation: null,
    }),
    {
      sido: "인천광역시",
      sigungu: "부평구",
      dongOrStation: null,
      changed: true,
    },
  );
});

test("canonicalizeAdminRegion promotes city-as-sido like 부천", () => {
  assert.deepEqual(
    canonicalizeAdminRegion({
      sido: "부천",
      sigungu: "신중동역근처(8월중순오픈)",
      dongOrStation: "지역",
    }),
    {
      sido: "경기도",
      sigungu: "부천시",
      dongOrStation: "신중동역근처(8월중순오픈)",
      changed: true,
    },
  );
});

test("canonicalizeAdminRegion drops invalid academy-like sigungu", () => {
  assert.deepEqual(
    canonicalizeAdminRegion({
      sido: "인천",
      sigungu: "로이즈무용학원",
      dongOrStation: "지역",
    }),
    {
      sido: "인천광역시",
      sigungu: null,
      dongOrStation: null,
      changed: true,
    },
  );
});

test("canonicalizeAdminRegion keeps already canonical values", () => {
  assert.deepEqual(
    canonicalizeAdminRegion({
      sido: "서울특별시",
      sigungu: "강남구",
      dongOrStation: null,
    }),
    {
      sido: "서울특별시",
      sigungu: "강남구",
      dongOrStation: null,
      changed: false,
    },
  );
});

test("canonicalizeAdminRegion clears academy-name sido junk", () => {
  assert.deepEqual(
    canonicalizeAdminRegion({
      sido: "KBEC발레아카데미",
      sigungu: null,
      dongOrStation: "지역",
    }),
    {
      sido: null,
      sigungu: null,
      dongOrStation: null,
      changed: true,
    },
  );
});
