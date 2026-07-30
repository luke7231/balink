import assert from "node:assert/strict";
import test from "node:test";
import {
  formatRepresentativePayDisplay,
  parseExplicitPayFromText,
  parsePaySlangFromText,
  defaultRepresentativePay,
  finalizeRepresentativePay,
  sanitizeRepresentativePay,
} from "@black-swan/domain";

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
    displayText: "총액/건당 9만원",
    minManwon: 9,
    maxManwon: 9,
    evidence: "페이 9",
    confidence: "high",
    hasConflict: false,
    alternateEvidence: null,
  });

  assert.equal(finalized.unit, "lump_sum");
  assert.equal(finalized.displayText, "총액/건당 9만원");
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
