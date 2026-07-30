import {
  JOB_TYPE_LABELS,
  SOURCE_LABELS,
  SUBSTITUTE_STATUS_LABELS,
  SUBSTITUTE_URGENCY_LABELS,
  TIME_SLOT_LABELS,
} from "./enums.js";
import { formatAdminLocationDisplay } from "./location/display.js";

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

export function formatLocation(
  sido: string | null,
  sigungu: string | null,
  dongOrStation?: string | null,
): string {
  return formatAdminLocationDisplay(sido, sigungu, dongOrStation) ?? "지역 미상";
}

export function formatSubstituteStatus(status: string | null): string {
  if (!status) return "미상";
  return SUBSTITUTE_STATUS_LABELS[status] ?? status;
}

export function formatSubstituteUrgency(urgency: string | null): string | null {
  if (!urgency) return null;
  return SUBSTITUTE_URGENCY_LABELS[urgency] ?? urgency;
}

export function formatLessonDates(dates: string[]): string {
  if (dates.length === 0) return "일정 미상";
  return dates.join(", ");
}

export function formatPay(
  payText: string | null,
  payMin: number | null,
  payMax: number | null,
  representativePayText?: string | null,
): string {
  if (representativePayText) return representativePayText;
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
