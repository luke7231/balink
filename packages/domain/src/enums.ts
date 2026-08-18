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
  one_time: "특강",
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
  morning: "☀️ 오전",
  afternoon: "🌤 오후",
  evening: "🌙 저녁",
  unknown: "협의",
};

export const AUDIENCE_TYPE_LABELS: Record<string, string> = {
  toddler: "영유아",
  child: "아동",
  elementary: "초등",
  teen: "청소년",
  adult: "성인",
  exam: "입시",
  mixed: "혼합",
  kids: "키즈",
  unknown: "대상 미상",
};

export const SUBJECT_TYPE_LABELS: Record<string, string> = {
  ballet: "발레",
  barre: "바레",
  ballet_fit: "발레핏",
  kpop_dance: "케이팝댄스",
  modern_dance: "현대무용",
  korean_dance: "한국무용",
  pilates: "필라테스",
  other: "기타",
};
