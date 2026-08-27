export const BLOCKED_JOB_DROP_REASON = "유흥·접대 등 부적절 구인";

export interface BlockedJobContentResult {
  blocked: boolean;
  reason?: string;
  matched?: string;
}

/** 단일 키워드. 성인 취미발레·여성 강사 등 정상 공고와 겹치지 않게 좁게 잡는다. */
const BLOCKED_KEYWORDS: Array<{ label: string; pattern: RegExp }> = [
  { label: "접대", pattern: /접대/ },
  { label: "스폰에이전시", pattern: /스폰\s*에이전시/i },
  { label: "조건만남", pattern: /조건\s*만남/ },
  { label: "원나잇", pattern: /원\s*나잇|원나잇/ },
  { label: "유흥", pattern: /유흥/ },
  { label: "룸살롱", pattern: /룸\s*살롱/ },
  { label: "단란주점", pattern: /단란\s*주점/ },
  { label: "텐프로", pattern: /텐\s*프로|10\s*프로/ },
  { label: "쩜오", pattern: /쩜\s*오/ },
];

/** 연령대 + 여성 타깃이 함께 있을 때만 (접대 스팸 패턴). */
const AGE_FEMALE_PATTERN = /203040.*여성|여성.*203040/;

export function evaluateBlockedJobContent(text: string | null | undefined): BlockedJobContentResult {
  const haystack = typeof text === "string" ? text : "";
  if (!haystack.trim()) return { blocked: false };

  for (const rule of BLOCKED_KEYWORDS) {
    if (rule.pattern.test(haystack)) {
      return {
        blocked: true,
        reason: BLOCKED_JOB_DROP_REASON,
        matched: rule.label,
      };
    }
  }

  if (AGE_FEMALE_PATTERN.test(haystack)) {
    return {
      blocked: true,
      reason: BLOCKED_JOB_DROP_REASON,
      matched: "203040+여성",
    };
  }

  return { blocked: false };
}

export function buildBlockedJobContentText(parts: {
  title?: string | null;
  company?: string | null;
  detailText?: string | null;
  description?: string | null;
}): string {
  return [parts.title, parts.company, parts.detailText, parts.description]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join("\n");
}

export function isBlockedJobContent(parts: {
  title?: string | null;
  company?: string | null;
  detailText?: string | null;
  description?: string | null;
}): BlockedJobContentResult {
  return evaluateBlockedJobContent(buildBlockedJobContentText(parts));
}
