import { JOB_TYPE_LABELS, SOURCE_LABELS, TIME_SLOT_LABELS } from "./enums.js";

export function formatSource(source: string): string {
  return SOURCE_LABELS[source as keyof typeof SOURCE_LABELS] ?? source;
}

export function formatJobType(jobType: string | null): string {
  if (!jobType) return "미분류";
  return JOB_TYPE_LABELS[jobType] ?? jobType;
}

export function formatTimeSlot(slot: string): string {
  return TIME_SLOT_LABELS[slot] ?? slot;
}

export function formatPostedAt(value: Date | string | null): string {
  if (!value) return "날짜 미상";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(typeof value === "string" ? new Date(value) : value);
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

export function jsonArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function jsonValue(value: unknown): unknown {
  return value ?? null;
}
