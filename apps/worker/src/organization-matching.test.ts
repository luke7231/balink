import assert from "node:assert/strict";
import test from "node:test";
import type { OrganizationExisting } from "@balink/domain";
import {
  buildOrganizationCandidate,
  decideOrganizationMatch,
  mergeOrganizationFields,
} from "./organization-matching.js";

test("buildOrganizationCandidate skips esangdance author-only company", () => {
  const candidate = buildOrganizationCandidate({
    source: "esangdance",
    company: "작성자닉네임",
    companyType: null,
    phones: ["010-1111-2222"],
  });
  assert.equal(candidate, null);
});

test("buildOrganizationCandidate uses balletmania company and profile", () => {
  const candidate = buildOrganizationCandidate({
    source: "balletmania",
    company: "리클래시 발레 스튜디오",
    companyType: "무용학원",
    sido: "서울",
    sigungu: "강남구",
    phones: ["02-123-4567"],
    academyImages: {
      companyProfileUrl: "https://www.balletmania.com/company_detail.html?uid=abc",
    },
  });
  assert.ok(candidate);
  assert.equal(candidate!.type, "ACADEMY");
  assert.equal(candidate!.matchKey, "profile:https://www.balletmania.com/company_detail.html?uid=abc");
});

test("decideOrganizationMatch reuses by phone and creates otherwise", () => {
  const candidate = buildOrganizationCandidate({
    source: "balletmania",
    company: "엘발레스튜디오",
    companyType: "무용학원",
    sido: "서울",
    sigungu: "강남구",
    phones: ["010-9999-8888"],
  })!;

  const existing: OrganizationExisting[] = [
    {
      id: "org-1",
      name: "엘발레",
      normalizedName: "엘발레",
      type: "ACADEMY",
      matchKey: "phone:01099998888",
      sido: "서울",
      sigungu: "송파구",
      dongOrStation: null,
      phones: ["01099998888"],
      emails: [],
      logoUrl: null,
      gallery: [],
      externalProfileUrl: null,
    },
  ];

  const decision = decideOrganizationMatch(candidate, existing);
  assert.equal(decision.kind, "reuse");
  if (decision.kind === "reuse") {
    assert.equal(decision.organizationId, "org-1");
    assert.match(decision.reason, /phone/);
  }

  const createDecision = decideOrganizationMatch(candidate, []);
  assert.equal(createDecision.kind, "create");
});

test("decideOrganizationMatch marks same name without region as ambiguous", () => {
  const candidate = buildOrganizationCandidate({
    source: "balletmania",
    company: "엘발레스튜디오",
    companyType: "무용학원",
  })!;
  const existing: OrganizationExisting[] = [
    {
      id: "org-a",
      name: "엘발레스튜디오",
      normalizedName: candidate.normalizedName,
      type: "ACADEMY",
      matchKey: "name|엘발레스튜디오|서울|강남구",
      sido: "서울",
      sigungu: "강남구",
      dongOrStation: null,
      phones: [],
      emails: [],
      logoUrl: null,
      gallery: [],
      externalProfileUrl: null,
    },
  ];
  const decision = decideOrganizationMatch(candidate, existing);
  assert.equal(decision.kind, "ambiguous");
});

test("mergeOrganizationFields only fills missing values and unions contacts", () => {
  const merged = mergeOrganizationFields(
    {
      id: "org-1",
      name: "리클래시",
      normalizedName: "리클래시",
      type: "UNKNOWN",
      matchKey: "name|리클래시|서울|강남구",
      sido: "서울",
      sigungu: null,
      dongOrStation: null,
      phones: ["021234567"],
      emails: [],
      logoUrl: null,
      gallery: [],
      externalProfileUrl: null,
    },
    {
      name: "리클래시 발레 스튜디오",
      normalizedName: "리클래시발레스튜디오",
      type: "ACADEMY",
      matchKey: "name|리클래시발레스튜디오|서울|강남구",
      sido: "서울",
      sigungu: "강남구",
      dongOrStation: "역삼동",
      phones: ["010-1111-2222"],
      emails: ["a@example.com"],
      logoUrl: "https://cdn.example/logo.png",
      gallery: [{ type: "interior", order: 1, url: "https://cdn.example/1.png" }],
      externalProfileUrl: "https://www.balletmania.com/company_detail.html?uid=abc",
      evidence: [],
    },
  );

  assert.equal(merged.type, "ACADEMY");
  assert.equal(merged.sigungu, "강남구");
  assert.deepEqual(merged.phones, ["021234567", "01011112222"]);
  assert.equal(merged.logoUrl, "https://cdn.example/logo.png");
});
