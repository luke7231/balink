import assert from "node:assert/strict";
import test from "node:test";
import {
  formatRepresentativePayDisplay,
  parseExplicitPayFromText,
  parsePaySlangFromText,
  parseBareWonPayFromText,
  defaultRepresentativePay,
  finalizeRepresentativePay,
  sanitizeRepresentativePay,
} from "@black-swan/domain";
import { normalizeRepresentativePayFromSources } from "./representative-pay-llm.js";

test("finalizeRepresentativePay rejects implausible hourly pay from LLM", () => {
  const finalized = finalizeRepresentativePay({
    ...defaultRepresentativePay(),
    unit: "hourly",
    displayText: "시간당 150만원",
    minManwon: 150,
    maxManwon: 150,
    evidence: "150",
    confidence: "high",
    hasConflict: false,
    alternateEvidence: null,
  });

  assert.equal(finalized.unit, "unspecified");
  assert.equal(finalized.displayText, "미기재");
});

test("finalizeRepresentativePay accepts valid lump_sum from LLM", () => {
  const finalized = finalizeRepresentativePay({
    ...defaultRepresentativePay(),
    unit: "lump_sum",
    displayText: "9만원",
    minManwon: 9,
    maxManwon: 9,
    evidence: "페이 9",
    confidence: "high",
    hasConflict: false,
    alternateEvidence: null,
  });

  assert.equal(finalized.unit, "lump_sum");
  assert.equal(finalized.displayText, "9만원");
  assert.equal(finalized.evidence, "페이 9");
});

test("finalizeRepresentativePay replaces free-form display with canonical unit label", () => {
  const finalized = finalizeRepresentativePay({
    ...defaultRepresentativePay(),
    unit: "per_class",
    displayText: "50분 3.0~3.5만원, 80분 4.0~4.5만원",
    minManwon: 3,
    maxManwon: 4.5,
    evidence: "페이 50분 - 3.0 ~ 3.5 80분 - 4.0 ~ 4.5",
    confidence: "high",
    hasConflict: true,
    alternateEvidence: "3만원~4만원 미만",
  });

  assert.equal(finalized.displayText, "회당 3만원~4.5만원");
});

test("parseExplicitPayFromText ignores floor area like 150평", () => {
  const title = "쌍문역 인근 목요일 또는 금요일 오전 발레/발레핏 강사님 모십니다.";
  const description = "150평 규모에 필라테스, 요가, 발레, 바레 수업을 진행하는 센터입니다.";
  assert.equal(parseExplicitPayFromText(title), null);
  assert.equal(parseExplicitPayFromText(description), null);
});

test("sanitizeRepresentativePay falls back to negotiable for implausible llm pay with negotiable summary", () => {
  const sanitized = sanitizeRepresentativePay(
    {
      unit: "hourly",
      displayText: "시간당 150만원",
      minManwon: 150,
      maxManwon: 150,
      evidence: "150",
      confidence: "high",
      hasConflict: false,
      alternateEvidence: null,
    },
    "추후 협의",
  );
  assert.equal(sanitized.unit, "negotiable");
  assert.equal(sanitized.evidence, "추후 협의");
});

test("parsePaySlangFromText treats 페이 9 as lump_sum 9manwon", () => {
  const parsed = parsePaySlangFromText("수업료 등 추가내용 ▶ 페이 9");
  assert.equal(parsed?.unit, "lump_sum");
  assert.equal(parsed?.minManwon, 9);
});

test("parsePaySlangFromText treats 페이는 8 as lump_sum 8manwon", () => {
  const parsed = parsePaySlangFromText("페이는 8입니다");
  assert.equal(parsed?.unit, "lump_sum");
  assert.equal(parsed?.minManwon, 8);
});

test("parsePaySlangFromText treats 페이_4.0 as lump_sum 4manwon", () => {
  const parsed = parsePaySlangFromText("페이_4.0");
  assert.equal(parsed?.unit, "lump_sum");
  assert.equal(parsed?.minManwon, 4);
});

test("parseBareWonPayFromText treats trailing 45000 as lump_sum 4.5manwon", () => {
  const parsed = parseBareWonPayFromText(
    "31일 금요일 오전 10시-10시50분 성인발레 대타강사님 구합니다.\n간단 이력서 부탁드립니다.\n45000",
  );
  assert.equal(parsed?.unit, "lump_sum");
  assert.equal(parsed?.minManwon, 4.5);
  assert.equal(parsed?.evidence, "45000");
});

test("parseExplicitPayFromText ignores date prefix 7/29 in title", () => {
  assert.equal(parseExplicitPayFromText("7/29(수) 6시반부터 대강 구합니다"), null);
});

test("formatRepresentativePayDisplay renders standard labels", () => {
  assert.equal(
    formatRepresentativePayDisplay({
      unit: "daily",
      displayText: "",
      minManwon: 9,
      maxManwon: 9,
      evidence: null,
      confidence: "high",
      hasConflict: false,
      alternateEvidence: null,
    }),
    "일당 9만원",
  );
});

test("normalizeRepresentativePayFromSources picks pay slang from substitute title when LLM missed it", () => {
  const normalized = normalizeRepresentativePayFromSources(
    defaultRepresentativePay(),
    "김포 발레학원 오늘 (초등반) 대강구합니다 페이 9",
    "연락 주세요",
    null,
  );

  assert.equal(normalized.unit, "lump_sum");
  assert.equal(normalized.minManwon, 9);
  assert.equal(normalized.displayText, "9만원");
});

test("normalizeRepresentativePayFromSources picks explicit per_class pay from substitute body", () => {
  const normalized = normalizeRepresentativePayFromSources(
    defaultRepresentativePay(),
    "대강 구합니다",
    "회당 3.5만원입니다",
    null,
  );

  assert.equal(normalized.unit, "per_class");
  assert.equal(normalized.minManwon, 3.5);
  assert.equal(normalized.displayText, "회당 3.5만원");
});

test("normalizeRepresentativePayFromSources prefers LLM variable pay when rules do not match", () => {
  const normalized = normalizeRepresentativePayFromSources(
    {
      ...defaultRepresentativePay(),
      unit: "variable",
      displayText: "타임별 상이",
      minManwon: 3,
      maxManwon: 24,
      evidence: "페이 타임당 3만 (총24만)",
      confidence: "medium",
      hasConflict: false,
      alternateEvidence: null,
    },
    "8/1(토), 8/8(토) 신월동 발레대강",
    "페이 타임당 3만 (총24만)",
    null,
  );

  assert.equal(normalized.unit, "variable");
  assert.equal(normalized.minManwon, 3);
  assert.equal(normalized.maxManwon, 24);
});
