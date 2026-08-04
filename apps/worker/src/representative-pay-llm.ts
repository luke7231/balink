import type { RepresentativePay } from "@black-swan/domain";
import { finalizeRepresentativePay, resolveRepresentativePayConflict } from "@black-swan/domain";

export const REPRESENTATIVE_PAY_LLM_RULES = [
  "representativePay.evidence에는 급여 판단에 쓴 원문 구절을 그대로 적는다.",
  "급여 추출 원칙:",
  "- 제목·본문 전체를 읽고, 맥락상 수업 대가·페이·급여·대강료로 해석되는 금액은 representativePay에 반드시 반영한다. 특정 표기 형식을 가정하지 않는다.",
  "- 페이, 급여, 타임당, 회당, 시간당, 일당, 총N만, N만/N원, 단독 숫자(45000) 등 어떤 형태든 급여 맥락이면 추출한다.",
  "- 타임·회차마다 금액이 다르거나 회당 금액과 합계(예: '타임당 3만 (총24만)')가 함께 있으면 unit=variable로 두고 min/max·evidence에 원문 근거를 남긴다.",
  "- unit은 hourly, per_class, daily, weekly, monthly, lump_sum, variable, negotiable, unspecified 중 하나이며, 금액은 만원 단위로 minManwon/maxManwon에 넣는다.",
  "- lump_sum: 원문에 페이·급여 금액이 한 줄로 적힌 경우 기본 단위. UI에는 접두어 없이 '13만원'처럼 금액만 표시한다.",
  "- per_class(회당), hourly(시간당) 등은 원문에 해당 단위가 명시될 때만 사용한다.",
  "- 날짜(7/29), 시각(7:30, 6시반), 면적(150평), 인원(8명), 전화번호 숫자는 급여가 아니다.",
  "- 급여가 정말 없을 때만 unspecified. 표현이 애매해도 맥락상 급여로 읽히면 medium confidence로 최선 추정한다.",
  "- listingSummaryPay(채용 목록 요약)와 본문·제목 급여가 다르면 hasConflict=true, alternateEvidence에 다른 표현을 적는다.",
].join("\n");

export function buildRepresentativePayJsonSchema() {
  const payUnitEnum = [
    "hourly",
    "per_class",
    "daily",
    "weekly",
    "monthly",
    "lump_sum",
    "variable",
    "negotiable",
    "unspecified",
  ];
  const confidenceEnum = ["high", "medium", "low"];

  return {
    type: "object",
    additionalProperties: false,
    required: [
      "unit",
      "displayText",
      "minManwon",
      "maxManwon",
      "evidence",
      "confidence",
      "hasConflict",
      "alternateEvidence",
    ],
    properties: {
      unit: { type: "string", enum: payUnitEnum },
      displayText: { type: "string" },
      minManwon: { type: ["number", "null"] },
      maxManwon: { type: ["number", "null"] },
      evidence: { type: ["string", "null"] },
      confidence: { type: "string", enum: confidenceEnum },
      hasConflict: { type: "boolean" },
      alternateEvidence: { type: ["string", "null"] },
    },
  };
}

/** 채용공고·대타 공통: LLM 결과 + 원문(title/body/summary) 재파싱 후 대표 급여 확정 */
export function normalizeRepresentativePayFromSources(
  llmPay: RepresentativePay,
  title: string,
  description: string,
  summaryPayText: string | null = null,
): RepresentativePay {
  return finalizeRepresentativePay(resolveRepresentativePayConflict(llmPay, title, description, summaryPayText));
}
