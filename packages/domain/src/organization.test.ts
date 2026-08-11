import assert from "node:assert/strict";
import test from "node:test";
import {
  buildOrganizationMatchKey,
  mapCompanyType,
  normalizeEmail,
  normalizeOrganizationName,
  normalizePhone,
  resolveOrganizationName,
} from "./organization.js";

test("normalizeOrganizationName strips whitespace and legal suffixes", () => {
  assert.equal(normalizeOrganizationName("  리클래시 발레 스튜디오  "), "리클래시발레스튜디오");
  assert.equal(normalizeOrganizationName("주식회사 라움교육"), "라움교육");
});

test("mapCompanyType maps known company types", () => {
  assert.equal(mapCompanyType("무용학원"), "ACADEMY");
  assert.equal(mapCompanyType("파견회사"), "DISPATCH_AGENCY");
  assert.equal(mapCompanyType(null), "UNKNOWN");
  assert.equal(mapCompanyType("기타"), "UNKNOWN");
});

test("resolveOrganizationName prefers displaySections and ignores esangdance nicknames", () => {
  assert.equal(
    resolveOrganizationName({
      source: "esangdance",
      company: "작성자닉네임",
      displaySections: [{ title: "학원명", content: "플로앤발레" }],
    }),
    "플로앤발레",
  );
  assert.equal(
    resolveOrganizationName({
      source: "esangdance",
      company: "Jjj33",
      displaySections: [{ title: "업체명", content: "Jjj33" }],
    }),
    null,
  );
  assert.equal(
    resolveOrganizationName({
      source: "esangdance",
      company: "온디느",
      displaySections: [
        {
          title: "학원명(지역)",
          content: "부천 상동 온디느무용학원 (7호선 상동역 1분거리)",
        },
      ],
    }),
    "온디느무용학원",
  );
  assert.equal(
    resolveOrganizationName({
      source: "esangdance",
      company: "발레포러스",
      displaySections: [{ title: "회사", content: "발레포러스" }],
    }),
    "발레포러스",
  );
  assert.equal(
    resolveOrganizationName({
      source: "balletmania",
      company: "리클래시 발레 스튜디오",
      displaySections: [],
    }),
    "리클래시 발레 스튜디오",
  );
});

test("buildOrganizationMatchKey prefers profile then phone then name+region", () => {
  assert.equal(
    buildOrganizationMatchKey({
      normalizedName: "리클래시발레스튜디오",
      externalProfileUrl: "https://www.balletmania.com/company_detail.html?uid=abc",
      phones: ["010-1234-5678"],
    }),
    "profile:https://www.balletmania.com/company_detail.html?uid=abc",
  );
  assert.equal(
    buildOrganizationMatchKey({
      normalizedName: "리클래시발레스튜디오",
      phones: ["010-1234-5678"],
    }),
    `phone:${normalizePhone("010-1234-5678")}`,
  );
  assert.equal(
    buildOrganizationMatchKey({
      normalizedName: "리클래시발레스튜디오",
      sido: "서울",
      sigungu: "강남구",
    }),
    "name|리클래시발레스튜디오|서울|강남구",
  );
  assert.equal(normalizeEmail(" Foo@Example.com "), "foo@example.com");
});
