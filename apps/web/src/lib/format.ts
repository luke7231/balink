const SOURCE_LABELS: Record<string, string> = {
  balletmania: "발레매니아",
  esangdance: "이상댄스",
};

const JOB_TYPE_LABELS: Record<string, string> = {
  regular: "정규",
  substitute: "대타",
};

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: "오전",
  afternoon: "오후",
  evening: "저녁",
  unknown: "협의",
};

export function formatSource(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

export function formatJobType(jobType: string | null): string {
  if (!jobType) return "미분류";
  return JOB_TYPE_LABELS[jobType] ?? jobType;
}

export function formatTimeSlot(slot: string): string {
  return TIME_SLOT_LABELS[slot] ?? slot;
}

export function formatPostedAt(value: string | null): string {
  if (!value) return "날짜 미상";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export function formatLocation(sido: string | null, sigungu: string | null, locationText: string | null): string {
  if (locationText) return locationText;
  if (sido && sigungu) return `${sido} ${sigungu}`;
  return sido || sigungu || "지역 미상";
}

export function formatPay(payText: string | null, payMin: number | null, payMax: number | null): string {
  if (payText) return payText;
  if (payMin != null && payMax != null) return `${payMin}~${payMax}만원`;
  if (payMin != null) return `${payMin}만원`;
  if (payMax != null) return `${payMax}만원`;
  return "협의";
}
