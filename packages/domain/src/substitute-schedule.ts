import type {
  DerivedSubstituteSchedule,
  DeriveSubstituteScheduleInput,
  DeriveSubstituteStatusInput,
  SubstitutePostStatus,
  SubstituteRecurrence,
  SubstituteScheduleKind,
  SubstituteSession,
  SubstituteTimeSlot,
  SubstituteUrgency,
} from "./substitute-post.js";
import { dateToKoreanWeekday } from "./notification-preference.js";

const KST_OFFSET = "+09:00";
const UNSCHEDULED_EXPIRE_DAYS = 7;
const INFERRED_END_DAYS = 30;
const RECURRENCE_MAX_WEEKS = 8;
const RECURRENCE_MAX_OCCURRENCES = 40;

const KOREAN_DAY_TO_INDEX: Record<string, number> = {
  일: 0,
  월: 1,
  화: 2,
  수: 3,
  목: 4,
  금: 5,
  토: 6,
};

const ENGLISH_DAY_TO_INDEX: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export function deriveSubstituteSchedule(input: DeriveSubstituteScheduleInput): DerivedSubstituteSchedule {
  const now = input.now ?? new Date();
  const explicitSessions = input.sessions
    .filter((session) => session.origin !== "recurrence" || session.date)
    .map(enrichSessionWeekday);
  const recurrence = input.recurrence ? normalizeRecurrence(input.recurrence, input.postedAt) : null;
  const expandedSessions = recurrence ? expandRecurrence(recurrence, input.postedAt) : [];
  const sessions = dedupeSessions([...explicitSessions, ...expandedSessions]).map(enrichSessionWeekday);
  const scheduleKind = resolveScheduleKind(explicitSessions, recurrence);
  const nextLessonAt = findNextLessonAt(sessions, now);
  const expiresAt = resolveExpiresAt(scheduleKind, sessions, recurrence, input.postedAt, now);
  const urgency = deriveUrgency(input.title, nextLessonAt, scheduleKind, now);
  const compatibility = deriveCompatibilityFields(sessions);

  return {
    scheduleKind,
    sessions,
    recurrence,
    nextLessonAt,
    expiresAt,
    urgency,
    ...compatibility,
  };
}

/** date가 있으면 KST 기준으로 day를 반드시 채운다 */
export function enrichSessionWeekday(session: SubstituteSession): SubstituteSession {
  if (session.day?.trim()) return session;
  if (!session.date) return session;
  const day = dateToKoreanWeekday(session.date);
  return day ? { ...session, day } : session;
}

export function deriveSubstituteStatus(input: DeriveSubstituteStatusInput): SubstitutePostStatus {
  if (input.deleted) return "DELETED";

  const now = input.now ?? new Date();
  if (input.expiresAt && input.expiresAt.getTime() < now.getTime()) {
    return "EXPIRED";
  }

  return "OPEN";
}

function resolveScheduleKind(
  explicitSessions: SubstituteSession[],
  recurrence: SubstituteRecurrence | null,
): SubstituteScheduleKind {
  if (explicitSessions.some((session) => session.date)) return "dated";
  if (recurrence) return "recurring";
  return "unscheduled";
}

function normalizeRecurrence(recurrence: SubstituteRecurrence, postedAt: Date | null): SubstituteRecurrence {
  const resolvedEnd = resolveRecurrenceEndDate(recurrence, postedAt);
  return {
    ...recurrence,
    startDate: recurrence.startDate ?? toKstDateString(postedAt) ?? todayKstDate(),
    endDate: resolvedEnd.endDate,
    endDateInferred: resolvedEnd.endDateInferred,
  };
}

function resolveRecurrenceEndDate(
  recurrence: SubstituteRecurrence,
  postedAt: Date | null,
): { endDate: string; endDateInferred: boolean } {
  if (recurrence.endDate) {
    return { endDate: recurrence.endDate, endDateInferred: recurrence.endDateInferred };
  }

  const monthEnd = inferMonthEndFromEvidence(recurrence.evidence, postedAt);
  if (monthEnd) {
    return { endDate: monthEnd, endDateInferred: true };
  }

  const base = postedAt ?? new Date();
  const inferred = addDays(base, INFERRED_END_DAYS);
  return { endDate: toKstDateString(inferred) ?? todayKstDate(), endDateInferred: true };
}

function inferMonthEndFromEvidence(evidence: string | null, postedAt: Date | null): string | null {
  if (!evidence) return null;
  const match = evidence.match(/(\d{1,2})\s*월\s*(?:한\s*달|한달|전체|내내|동안)/);
  if (!match) return null;

  const month = Number(match[1]);
  if (!Number.isFinite(month) || month < 1 || month > 12) return null;

  const baseYear = postedAt ? postedAt.getFullYear() : new Date().getFullYear();
  const baseMonth = postedAt ? postedAt.getMonth() + 1 : new Date().getMonth() + 1;
  const year = month < baseMonth ? baseYear + 1 : baseYear;
  const lastDay = new Date(`${year}-${String(month).padStart(2, "0")}-01T12:00:00${KST_OFFSET}`);
  lastDay.setMonth(lastDay.getMonth() + 1);
  lastDay.setDate(0);
  return toKstDateString(lastDay);
}

function normalizeDaysOfWeek(days: string[]): string[] {
  return days.flatMap((day) => day.split(/[·,\s/]+/).map((part) => part.trim()).filter(Boolean));
}

function expandRecurrence(recurrence: SubstituteRecurrence, postedAt: Date | null): SubstituteSession[] {
  const startDate = recurrence.startDate ?? toKstDateString(postedAt) ?? todayKstDate();
  const endDate = recurrence.endDate ?? startDate;
  const dayIndexes = normalizeDaysOfWeek(recurrence.daysOfWeek)
    .map(resolveDayIndex)
    .filter((value): value is number => value != null);
  if (dayIndexes.length === 0) return [];

  const sessions: SubstituteSession[] = [];
  const start = parseKstDate(startDate);
  const end = parseKstDate(endDate);
  const hardEnd = addDays(start, RECURRENCE_MAX_WEEKS * 7);
  const effectiveEnd = end.getTime() < hardEnd.getTime() ? end : hardEnd;

  for (let cursor = new Date(start); cursor.getTime() <= effectiveEnd.getTime() && sessions.length < RECURRENCE_MAX_OCCURRENCES; cursor = addDays(cursor, 1)) {
    const dayIndex = getKstDayIndex(cursor);
    if (!dayIndexes.includes(dayIndex)) continue;

    sessions.push({
      date: toKstDateString(cursor),
      day: indexToKoreanDay(dayIndex),
      startTime: recurrence.startTime,
      endTime: recurrence.endTime,
      durationMinutes: recurrence.durationMinutes,
      audienceTypes: recurrence.audienceTypes,
      subjectTypes: recurrence.subjectTypes,
      pay: recurrence.pay,
      evidence: recurrence.evidence,
      confidence: recurrence.confidence,
      origin: "recurrence",
    });
  }

  return sessions;
}

function dedupeSessions(sessions: SubstituteSession[]): SubstituteSession[] {
  const seen = new Set<string>();
  const result: SubstituteSession[] = [];

  for (const session of sessions) {
    const key = [
      session.date ?? "",
      session.startTime ?? "",
      session.endTime ?? "",
      session.audienceTypes.join(","),
      session.subjectTypes.join(","),
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(session);
  }

  return result.sort((left, right) => {
    const leftDate = left.date ?? "";
    const rightDate = right.date ?? "";
    if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
    return (left.startTime ?? "").localeCompare(right.startTime ?? "");
  });
}

function findNextLessonAt(sessions: SubstituteSession[], now: Date): Date | null {
  const upcoming = sessions
    .map((session) => sessionToDateTime(session))
    .filter((value): value is Date => value != null && value.getTime() >= now.getTime())
    .sort((left, right) => left.getTime() - right.getTime());

  return upcoming[0] ?? null;
}

function resolveExpiresAt(
  scheduleKind: SubstituteScheduleKind,
  sessions: SubstituteSession[],
  recurrence: SubstituteRecurrence | null,
  postedAt: Date | null,
  now: Date,
): Date {
  if (scheduleKind === "unscheduled") {
    const base = postedAt ?? now;
    return endOfKstDay(addDays(base, UNSCHEDULED_EXPIRE_DAYS));
  }

  if (scheduleKind === "recurring" && recurrence?.endDate) {
    return endOfKstDay(parseKstDate(recurrence.endDate));
  }

  const datedSessions = sessions.filter((session) => session.date);
  if (datedSessions.length > 0) {
    const lastDate = datedSessions
      .map((session) => session.date as string)
      .sort((left, right) => left.localeCompare(right))
      .at(-1);
    if (lastDate) return endOfKstDay(parseKstDate(lastDate));
  }

  const base = postedAt ?? now;
  return endOfKstDay(addDays(base, UNSCHEDULED_EXPIRE_DAYS));
}

function deriveUrgency(
  title: string,
  nextLessonAt: Date | null,
  scheduleKind: SubstituteScheduleKind,
  now: Date,
): SubstituteUrgency {
  if (scheduleKind === "unscheduled") {
    if (/급구|오늘|today/i.test(title)) return "same_day";
    if (/내일|tomorrow/i.test(title)) return "next_day";
    return "normal";
  }

  if (!nextLessonAt) return "normal";

  const today = todayKstDate();
  const lessonDate = toKstDateString(nextLessonAt);
  if (lessonDate === today) return "same_day";

  const tomorrow = toKstDateString(addDays(parseKstDate(today), 1));
  if (lessonDate === tomorrow) return "next_day";

  return "normal";
}

function deriveCompatibilityFields(sessions: SubstituteSession[]): {
  lessonDates: string[];
  timeSlots: SubstituteTimeSlot[];
  audienceTypes: string[];
  subjectTypes: string[];
} {
  const lessonDates = [...new Set(sessions.map((session) => session.date).filter((value): value is string => Boolean(value)))].sort();
  const timeSlots = dedupeTimeSlots(
    sessions.map((session) => ({
      start: session.startTime,
      end: session.endTime,
      raw: buildTimeRaw(session.startTime, session.endTime),
    })),
  );
  const audienceTypes = [...new Set(sessions.flatMap((session) => session.audienceTypes))];
  const subjectTypes = [...new Set(sessions.flatMap((session) => session.subjectTypes))];

  return { lessonDates, timeSlots, audienceTypes, subjectTypes };
}

function dedupeTimeSlots(slots: SubstituteTimeSlot[]): SubstituteTimeSlot[] {
  const seen = new Set<string>();
  return slots.filter((slot) => {
    const key = `${slot.start ?? ""}|${slot.end ?? ""}|${slot.raw ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return Boolean(slot.start || slot.end || slot.raw);
  });
}

function buildTimeRaw(startTime: string | null, endTime: string | null): string | null {
  if (startTime && endTime) return `${startTime}~${endTime}`;
  return startTime ?? endTime;
}

function sessionToDateTime(session: SubstituteSession): Date | null {
  if (!session.date) return null;
  const time = session.startTime ?? "12:00";
  const normalizedTime = normalizeTime(time);
  if (!normalizedTime) return parseKstDate(session.date);
  return new Date(`${session.date}T${normalizedTime}:00${KST_OFFSET}`);
}

function normalizeTime(value: string): string | null {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function resolveDayIndex(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  if (trimmed in KOREAN_DAY_TO_INDEX) return KOREAN_DAY_TO_INDEX[trimmed];
  if (trimmed in ENGLISH_DAY_TO_INDEX) return ENGLISH_DAY_TO_INDEX[trimmed];
  return null;
}

function indexToKoreanDay(index: number): string {
  return Object.entries(KOREAN_DAY_TO_INDEX).find(([, value]) => value === index)?.[0] ?? "";
}

function parseKstDate(value: string): Date {
  return new Date(`${value}T12:00:00${KST_OFFSET}`);
}

function endOfKstDay(value: Date): Date {
  const date = toKstDateString(value);
  return new Date(`${date}T23:59:59${KST_OFFSET}`);
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function getKstDayIndex(value: Date): number {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", weekday: "short" }).format(value);
  return ENGLISH_DAY_TO_INDEX[weekday.slice(0, 3).toLowerCase()] ?? 0;
}

function todayKstDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function toKstDateString(value: Date | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}
