import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildPublicPaySummary,
  buildPublicTitleSummary,
  redactBalletmaniaJobDetail,
  redactBalletmaniaJobSummary,
} from "./public-exposure.js";
import type { JobPostDetail, JobPostSummary } from "./job-post.js";

test("buildPublicTitleSummary prefers dong then sigungu with Korean labels", () => {
  assert.equal(
    buildPublicTitleSummary({
      sigungu: "평택시",
      dongOrStation: null,
      jobType: "regular",
      audienceTypes: ["toddler"],
      subjectTypes: ["ballet"],
      timeSlots: ["morning", "unknown"],
    }),
    "평택시 · 영유아 · 정규 · 오전",
  );
});

test("buildPublicTitleSummary omits generic ballet but keeps barre and ballet fit", () => {
  assert.equal(
    buildPublicTitleSummary({
      sigungu: "강남구",
      jobType: "regular",
      audienceTypes: ["adult"],
      subjectTypes: ["ballet", "barre", "ballet_fit"],
      timeSlots: ["morning"],
    }),
    "강남구 · 성인 · 바레 · 발레핏 · 정규 · 오전",
  );
});

test("buildPublicPaySummary uses range band without raw text", () => {
  assert.equal(
    buildPublicPaySummary({ payMinManwon: 3, payMaxManwon: 4 }),
    "3~4만원대",
  );
  assert.equal(buildPublicPaySummary({ payNegotiable: true }), "협의");
  assert.equal(buildPublicPaySummary({ hasPaySignal: true }), "급여 정보 있음");
});

test("redactBalletmaniaJobSummary replaces title and pay text", () => {
  const job: JobPostSummary = {
    id: "1",
    title: "(강남) 성인취미발레 평일 저녁 모집합니다 상세 장문",
    sourcePrimary: "balletmania",
    jobType: "regular",
    postedAt: null,
    locationText: "서울 강남구 역삼동",
    sido: "서울특별시",
    sigungu: "강남구",
    dongOrStation: "역삼동",
    audienceTypes: ["adult"],
    subjectTypes: ["ballet"],
    days: ["월", "수"],
    dayGroups: [["월", "수"]],
    timeSlots: ["evening"],
    times: ["19:00"],
    payText: "시간 당 페이 3만원~4만원 미만 희망시급 기재",
    payMinManwon: 3,
    payMaxManwon: 4,
    payNegotiable: false,
    representativePayText: "시간당 3~4만원",
    academyThumbnailUrl: "https://example.com/a.jpg",
    academyThumbnailType: "logo",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };

  const redacted = redactBalletmaniaJobSummary(job);
  assert.equal(redacted.title, "역삼동 · 성인 · 정규 · 저녁");
  assert.equal(redacted.payText, null);
  assert.equal(redacted.representativePayText, "3~4만원대");
  assert.equal(redacted.locationText, "서울 강남구 역삼동");
  assert.equal(redacted.dongOrStation, "역삼동");
});

test("redactBalletmaniaJobDetail strips full text fields", () => {
  const detail = {
    ...({
      id: "1",
      title: "원문 제목",
      sourcePrimary: "balletmania",
      jobType: "regular",
      postedAt: null,
      locationText: "서울 강남구",
      sido: "서울특별시",
      sigungu: "강남구",
      dongOrStation: null,
      audienceTypes: [],
      subjectTypes: ["발레"],
      days: [],
      dayGroups: [],
      timeSlots: [],
      times: [],
      payText: "원문 급여",
      payMinManwon: null,
      payMaxManwon: null,
      payNegotiable: true,
      representativePayText: null,
      academyThumbnailUrl: null,
      academyThumbnailType: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    } satisfies JobPostSummary),
    description: "긴 본문",
    status: "open",
    isBallet: true,
    balletConfidence: "high",
    classCount: null,
    durationMinutes: null,
    payType: null,
    contactMethods: ["phone"],
    contactEmails: ["a@b.c"],
    contactPhones: ["010"],
    requirements: { a: 1 },
    confidence: { b: 2 },
    displaySections: [{ title: "모집", content: "전문" }],
    representativePay: {
      unit: "hourly",
      displayText: "원문",
      minManwon: 3,
      maxManwon: 4,
      evidence: "원문 근거",
      confidence: "high",
      hasConflict: false,
      alternateEvidence: null,
    },
    locationSource: null,
    academyLogoUrl: "https://example.com/logo.png",
    academyGallery: [],
    organization: {
      id: "org1",
      name: "테스트발레",
      type: "ACADEMY",
      sido: null,
      sigungu: null,
      dongOrStation: null,
      logoUrl: null,
      externalProfileUrl: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
  } satisfies JobPostDetail;

  const redacted = redactBalletmaniaJobDetail(detail);
  assert.equal(redacted.description, null);
  assert.deepEqual(redacted.displaySections, []);
  assert.deepEqual(redacted.contactPhones, []);
  assert.equal(redacted.organization?.name, "테스트발레");
  assert.equal(redacted.representativePay?.evidence, null);
  assert.equal(redacted.academyLogoUrl, "https://example.com/logo.png");
});

test("esangdance posts are not redacted", () => {
  const job: JobPostSummary = {
    id: "2",
    title: "이상댄스 원제목",
    sourcePrimary: "esangdance",
    jobType: "regular",
    postedAt: null,
    locationText: null,
    sido: null,
    sigungu: null,
    dongOrStation: null,
    audienceTypes: [],
    subjectTypes: [],
    days: [],
    dayGroups: [],
    timeSlots: [],
    times: [],
    payText: "시급 5만원",
    payMinManwon: 5,
    payMaxManwon: 5,
    payNegotiable: false,
    representativePayText: null,
    academyThumbnailUrl: null,
    academyThumbnailType: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };
  assert.equal(redactBalletmaniaJobSummary(job).title, "이상댄스 원제목");
  assert.equal(redactBalletmaniaJobSummary(job).payText, "시급 5만원");
});
