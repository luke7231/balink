import {
  JOB_TYPE_LABELS,
  SOURCE_LABELS,
  SUBSTITUTE_STATUS_LABELS,
  SUBSTITUTE_URGENCY_LABELS,
  TIME_SLOT_LABELS,
} from "./enums.js";
import { formatAdminLocationDisplay } from "./location/display.js";
import { dateToKoreanWeekday } from "./notification-preference.js";
import { ORGANIZATION_TYPE_LABELS, type OrganizationType } from "./organization.js";

const SUBSTITUTE_SESSION_CARD_MAX = 4;

export function formatSource(source: string): string {
  return SOURCE_LABELS[source as keyof typeof SOURCE_LABELS] ?? source;
}

export function formatJobType(jobType: string | null): string {
  if (!jobType) return "미분류";
  return JOB_TYPE_LABELS[jobType] ?? jobType;
}

export function formatOrganizationType(type: string | null | undefined): string {
  if (!type) return ORGANIZATION_TYPE_LABELS.UNKNOWN;
  return ORGANIZATION_TYPE_LABELS[type as OrganizationType] ?? type;
}

export function formatTimeSlot(slot: string): string {
  return TIME_SLOT_LABELS[slot] ?? slot;
}

export { displayableTimeSlots, formatDayGroups } from "./schedule.js";

export function formatPostedAt(value: Date | string | null): string {
  if (!value) return "날짜 미상";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "날짜 미상";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) return "날짜 미상";
  return `${year}.${month}.${day}`;
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
  if (!urgency || urgency === "normal") return null;
  return SUBSTITUTE_URGENCY_LABELS[urgency] ?? urgency;
}

/** YYYY-MM-DD → M/D (연도 생략). 파싱 실패 시 원문 반환 */
export function formatCompactLessonDate(dateText: string | null | undefined): string | null {
  if (!dateText) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText.trim());
  if (!match) return dateText.trim() || null;
  return `${Number(match[2])}/${Number(match[3])}`;
}

export function resolveSessionWeekday(session: {
  date?: string | null;
  day?: string | null;
}): string | null {
  const day = typeof session.day === "string" ? session.day.trim() : "";
  if (day) return day;
  return session.date ? dateToKoreanWeekday(session.date) : null;
}

export function formatSessionTimeRange(session: {
  startTime?: string | null;
  endTime?: string | null;
}): string {
  if (session.startTime && session.endTime) return `${session.startTime}~${session.endTime}`;
  return session.startTime || session.endTime || "";
}

export function formatWeekdayFull(day: string | null | undefined): string | null {
  if (!day) return null;
  const trimmed = day.trim();
  if (!trimmed) return null;
  if (trimmed.endsWith("요일")) return trimmed;
  if (trimmed.length === 1) return `${trimmed}요일`;
  return trimmed;
}

export function formatSubstituteDateHeading(session: {
  date?: string | null;
  day?: string | null;
}): string {
  const date = formatCompactLessonDate(session.date);
  const weekday = formatWeekdayFull(resolveSessionWeekday(session));
  return [date, weekday].filter(Boolean).join(" ");
}

export function formatSubstituteSessionLabel(session: {
  date?: string | null;
  day?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}): string {
  const datePart = formatSubstituteDateHeading(session);
  const time = formatSessionTimeRange(session);
  return [datePart, time].filter(Boolean).join(" ");
}

export interface SubstituteSessionDateGroup {
  date: string;
  dateLabel: string;
  times: string[];
}

type SubstituteSessionLike = {
  date?: string | null;
  day?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  origin?: string | null;
};

function collectDatedSessions(sessions: SubstituteSessionLike[]): SubstituteSessionLike[] {
  const explicit = sessions.filter((session) => session.origin !== "recurrence");
  return (explicit.length > 0 ? explicit : sessions).filter((session) => session.date);
}

/** 같은 날짜 세션을 날짜 헤더 + 타임 목록으로 묶는다 */
export function groupSubstituteSessionsByDate(
  sessions: SubstituteSessionLike[],
): SubstituteSessionDateGroup[] {
  const dated = collectDatedSessions(sessions);
  const groups: SubstituteSessionDateGroup[] = [];

  for (const session of dated) {
    const date = session.date!;
    const time = formatSessionTimeRange(session);
    const existing = groups.find((group) => group.date === date);
    if (existing) {
      if (time && !existing.times.includes(time)) existing.times.push(time);
      continue;
    }
    groups.push({
      date,
      dateLabel: formatSubstituteDateHeading(session),
      times: time ? [time] : [],
    });
  }

  return groups;
}

export function listSubstituteSessionCardGroups(
  sessions: SubstituteSessionLike[],
  options: { max?: number } = {},
): { groups: SubstituteSessionDateGroup[]; overflow: number } {
  const max = options.max ?? SUBSTITUTE_SESSION_CARD_MAX;
  const allGroups = groupSubstituteSessionsByDate(sessions);
  const totalTimes = allGroups.reduce((sum, group) => sum + Math.max(group.times.length, 1), 0);
  if (totalTimes <= max) return { groups: allGroups, overflow: 0 };

  const groups: SubstituteSessionDateGroup[] = [];
  let used = 0;
  for (const group of allGroups) {
    if (used >= max) break;
    const remaining = max - used;
    const times = group.times.length > 0 ? group.times.slice(0, remaining) : [];
    groups.push({ ...group, times });
    used += Math.max(times.length, 1);
  }
  return { groups, overflow: totalTimes - used };
}

export function listSubstituteSessionCardLabels(
  sessions: SubstituteSessionLike[],
  options: { max?: number } = {},
): { labels: string[]; overflow: number } {
  const { groups, overflow } = listSubstituteSessionCardGroups(sessions, options);
  const labels = groups.flatMap((group) => {
    if (group.times.length === 0) return [group.dateLabel];
    return [group.dateLabel, ...group.times.map((time) => `· ${time}`)];
  });
  return { labels, overflow };
}

/** 카드/요약용: 날짜 그룹 나열, 타임 4개 초과 시 '외 n개' */
export function formatSubstituteSessionsCardLabel(
  sessions: SubstituteSessionLike[],
  options: { max?: number } = {},
): string | null {
  const { labels, overflow } = listSubstituteSessionCardLabels(sessions, options);
  if (labels.length === 0) return null;
  const joined = labels.join(" · ");
  return overflow > 0 ? `${joined} 외 ${overflow}개` : joined;
}

export function formatLessonDates(dates: string[]): string {
  if (dates.length === 0) return "일정 협의";
  return dates
    .map((date) => {
      const compact = formatCompactLessonDate(date);
      const weekday = dateToKoreanWeekday(date);
      return [compact, weekday].filter(Boolean).join(" ");
    })
    .join(" · ");
}

export function formatSubstituteScheduleKind(kind: string | null): string {
  if (kind === "recurring") return "반복 일정";
  if (kind === "unscheduled") return "일정 협의";
  return "확정 일정";
}

export function formatRecurrenceSummary(recurrence: {
  startDate?: string | null;
  endDate?: string | null;
  daysOfWeek?: string[];
  startTime?: string | null;
  endTime?: string | null;
} | null): string | null {
  if (!recurrence) return null;
  const days = recurrence.daysOfWeek?.join("·") || "";
  const time =
    recurrence.startTime && recurrence.endTime
      ? `${recurrence.startTime}~${recurrence.endTime}`
      : recurrence.startTime || recurrence.endTime || "";
  const start = formatCompactLessonDate(recurrence.startDate);
  const end = formatCompactLessonDate(recurrence.endDate);
  const range = start && end ? `${start}~${end}` : end || start || "";
  return [range, days, time].filter(Boolean).join(" ");
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
