export type DaysMode = "or" | "and";
export type AlertTimeSlot = "morning" | "afternoon" | "evening";

export const ALERT_DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
export const ALERT_TIME_SLOTS: AlertTimeSlot[] = ["morning", "afternoon", "evening"];

export interface JobTypeAlertPreference {
  enabled: boolean;
  days: string[];
  daysMode: DaysMode;
  timeSlots: AlertTimeSlot[];
}

export interface NotificationPreference {
  enabled: boolean;
  regular: JobTypeAlertPreference;
  substitute: JobTypeAlertPreference;
}

export function defaultJobTypeAlertPreference(): JobTypeAlertPreference {
  return {
    enabled: true,
    days: [],
    daysMode: "or",
    timeSlots: [],
  };
}

export function defaultNotificationPreference(): NotificationPreference {
  return {
    enabled: true,
    regular: defaultJobTypeAlertPreference(),
    substitute: defaultJobTypeAlertPreference(),
  };
}

export function parseJobTypeAlertPreference(value: unknown): JobTypeAlertPreference {
  const fallback = defaultJobTypeAlertPreference();
  if (!value || typeof value !== "object") return fallback;

  const raw = value as Record<string, unknown>;
  const days = Array.isArray(raw.days)
    ? raw.days.filter(
        (day): day is string =>
          typeof day === "string" && (ALERT_DAYS as readonly string[]).includes(day),
      )
    : [];
  const timeSlots = Array.isArray(raw.timeSlots)
    ? raw.timeSlots.filter((slot): slot is AlertTimeSlot =>
        typeof slot === "string" && ALERT_TIME_SLOTS.includes(slot as AlertTimeSlot),
      )
    : [];

  return {
    enabled: raw.enabled !== false,
    days,
    daysMode: raw.daysMode === "and" ? "and" : "or",
    timeSlots,
  };
}

export function parseNotificationPreference(input: {
  enabled?: boolean | null;
  regularJson?: unknown;
  substituteJson?: unknown;
} | null | undefined): NotificationPreference {
  if (!input) return defaultNotificationPreference();
  return {
    enabled: input.enabled !== false,
    regular: parseJobTypeAlertPreference(input.regularJson),
    substitute: parseJobTypeAlertPreference(input.substituteJson),
  };
}

export function matchesDays(postDays: string[], preference: JobTypeAlertPreference): boolean {
  if (preference.days.length === 0) return true;
  if (preference.daysMode === "and") {
    return preference.days.every((day) => postDays.includes(day));
  }
  return preference.days.some((day) => postDays.includes(day));
}

export function matchesTimeSlots(postTimeSlots: string[], preference: JobTypeAlertPreference): boolean {
  if (preference.timeSlots.length === 0) return true;
  return preference.timeSlots.some((slot) => postTimeSlots.includes(slot));
}

/** 시계열 시각을 오전/오후/저녁으로 환산 (대타 매칭용) */
export function clockTimeToAlertSlot(hhmm: string): AlertTimeSlot | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function substituteTimesToAlertSlots(
  times: Array<{ start?: string | null; end?: string | null }>,
): AlertTimeSlot[] {
  const slots = new Set<AlertTimeSlot>();
  for (const time of times) {
    const startSlot = time.start ? clockTimeToAlertSlot(time.start) : null;
    if (startSlot) slots.add(startSlot);
  }
  return [...slots];
}

/** YYYY-MM-DD → 한국 요일 라벨 */
export function dateToKoreanWeekday(dateText: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText.trim());
  if (!match) return null;
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00+09:00`);
  if (Number.isNaN(date.getTime())) return null;
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  }).format(date);
  const map: Record<string, string> = {
    Mon: "월",
    Tue: "화",
    Wed: "수",
    Thu: "목",
    Fri: "금",
    Sat: "토",
    Sun: "일",
  };
  return map[weekday] ?? null;
}

export function lessonDatesToKoreanDays(dates: string[]): string[] {
  return [...new Set(dates.map(dateToKoreanWeekday).filter((day): day is string => Boolean(day)))];
}

export function matchesJobTypeAlert(
  preference: JobTypeAlertPreference,
  input: { days: string[]; timeSlots: string[] },
): boolean {
  if (!preference.enabled) return false;
  return matchesDays(input.days, preference) && matchesTimeSlots(input.timeSlots, preference);
}

export function matchesRegion(
  interestRegions: Array<{ sido: string; sigungu: string }>,
  post: { sido?: string | null; sigungu?: string | null },
): boolean {
  if (interestRegions.length === 0) return false;
  if (!post.sido || !post.sigungu) return false;
  return interestRegions.some(
    (region) => region.sido === post.sido && region.sigungu === post.sigungu,
  );
}
