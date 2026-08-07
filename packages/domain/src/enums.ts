export type SourceName = "balletmania" | "esangdance";
export type ScraperRunStatus = "running" | "success" | "failed";
export type LlmMode = "off" | "fallback" | "all";

export const SOURCE_LABELS: Record<SourceName, string> = {
  balletmania: "발레매니아",
  esangdance: "이상댄스",
};

export const JOB_TYPE_LABELS: Record<string, string> = {
  regular: "정규",
  substitute: "대강",
};

export const SUBSTITUTE_STATUS_LABELS: Record<string, string> = {
  OPEN: "모집 중",
  EXPIRED: "마감",
  DELETED: "삭제됨",
};

export const SUBSTITUTE_URGENCY_LABELS: Record<string, string> = {
  same_day: "오늘",
  next_day: "내일",
  normal: "일반",
};

export const TIME_SLOT_LABELS: Record<string, string> = {
  morning: "오전",
  afternoon: "오후",
  evening: "저녁",
  unknown: "협의",
};
