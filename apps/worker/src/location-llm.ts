import { extractLocationHints, formatAdminLocationDisplay, validateAdminDistrict } from "@black-swan/domain";

export const LOCATION_LLM_RULES = [
  "지역 판단 규칙:",
  "- 제목과 본문 전체를 읽고 근무·수업 장소의 시·도, 시·군·구, 동 또는 역을 파악한다.",
  "- 예: '서울 영등포구 선유도역 3분 거리'는 sido='서울특별시', sigungu='영등포구', dongOrStation='선유도역'이다.",
  "- 신도시명·동명·역명만 적혀 있어도 일반적인 지리 지식으로 소속 행정구역을 찾아 완성한다. 이는 새 사실 생성이 아니라 장소 해석이다.",
  "- 예: '다산신도시'는 sido='경기도', sigungu='남양주시', dongOrStation='다산동'이다.",
  "- 예: '인천 구월동'은 sido='인천광역시', sigungu='남동구', dongOrStation='구월동'이다.",
  "- 장소명으로 행정구역을 합리적으로 완성한 경우 confidence='medium', 원문에 행정구역이 직접 명시되면 confidence='high'로 둔다.",
  "- 학원명은 지역 필드에 넣지 않는다. evidence에는 지역 판단에 쓴 원문 구절을 그대로 적는다.",
  "- 장소명조차 없거나 어느 지역인지 특정할 수 없을 때만 각 필드를 null로 두고 confidence='low'로 표시한다.",
  "- 입력에 locationHints(제목·본문 rule 추출)가 있으면 참고하되, 원문과 충돌하면 원문을 우선한다.",
].join("\n");

export function buildLocationJsonSchema() {
  const confidenceEnum = ["high", "medium", "low"];

  return {
    type: "object",
    additionalProperties: false,
    required: ["sido", "sigungu", "dongOrStation", "evidence", "confidence"],
    properties: {
      sido: { type: ["string", "null"] },
      sigungu: { type: ["string", "null"] },
      dongOrStation: { type: ["string", "null"] },
      evidence: { type: ["string", "null"] },
      confidence: { type: "string", enum: confidenceEnum },
    },
  };
}

export function buildLocationHintsPayload(title: string, description: string) {
  return extractLocationHints(title, description).map((hint) => ({
    sido: hint.sido,
    sigungu: hint.sigungu,
    dongOrStation: hint.dongOrStation,
    evidence: hint.evidence,
    source: hint.source,
  }));
}

/** geocode 검색어: LLM evidence → 목록 지역(채용) → rule hints 순 fallback */
export function resolveLocationTextForGeocode(input: {
  llmEvidence: string | null;
  listingSummaryRegion?: string | null;
  title: string;
  description: string;
}): string | null {
  if (input.llmEvidence?.trim()) return input.llmEvidence.trim();
  if (input.listingSummaryRegion?.trim()) return input.listingSummaryRegion.trim();

  const hints = extractLocationHints(input.title, input.description);
  const validatedHint = hints.find((hint) => validateAdminDistrict(hint.sido, hint.sigungu).valid);
  if (validatedHint) {
    return (
      formatAdminLocationDisplay(validatedHint.sido, validatedHint.sigungu, validatedHint.dongOrStation) ??
      validatedHint.evidence?.trim() ??
      null
    );
  }

  const first = hints[0];
  if (!first) return null;
  if (first.evidence?.trim()) return first.evidence.trim();
  return formatAdminLocationDisplay(first.sido, first.sigungu, first.dongOrStation);
}
