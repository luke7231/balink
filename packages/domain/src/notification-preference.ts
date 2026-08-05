export type AlertTimeSlot = "morning" | "afternoon" | "evening";

export const ALERT_DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
export const ALERT_TIME_SLOTS: AlertTimeSlot[] = ["morning", "afternoon", "evening"];
export const MAX_ALERT_CONDITIONS = 5;

/** @deprecated daysMode는 제거됨. 하위 호환 파싱용으로만 유지 */
export type DaysMode = "or" | "and";

export interface AlertCondition {
  id: string;
  enabled: boolean;
  /** 빈 배열 = 요일 상관없음 */
  days: string[];
  /** 빈 배열 = 시간대 상관없음 */
  timeSlots: AlertTimeSlot[];
}

export interface JobTypeAlertPreference {
  enabled: boolean;
  /** 조건 카드. 하나라도 맞으면 매칭 (OR) */
  conditions: AlertCondition[];
}

export interface NotificationPreference {
  enabled: boolean;
  regular: JobTypeAlertPreference;
  substitute: JobTypeAlertPreference;
}

let conditionSeq = 0;

export function createAlertConditionId(): string {
  conditionSeq += 1;
  return `c_${Date.now().toString(36)}_${conditionSeq.toString(36)}`;
}

export function defaultAlertCondition(
  partial?: Partial<Omit<AlertCondition, "id">> & { id?: string },
): AlertCondition {
  return {
    id: partial?.id ?? createAlertConditionId(),
    enabled: partial?.enabled !== false,
    days: partial?.days ?? [],
    timeSlots: partial?.timeSlots ?? [],
  };
}

export function defaultJobTypeAlertPreference(): JobTypeAlertPreference {
  return {
    enabled: true,
    conditions: [defaultAlertCondition()],
  };
}

export function defaultNotificationPreference(): NotificationPreference {
  return {
    enabled: true,
    regular: defaultJobTypeAlertPreference(),
    substitute: defaultJobTypeAlertPreference(),
  };
}

function parseDays(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (day): day is string =>
      typeof day === "string" && (ALERT_DAYS as readonly string[]).includes(day),
  );
}

function parseTimeSlots(value: unknown): AlertTimeSlot[] {
  if (!Array.isArray(value)) return [];
  return value.filter((slot): slot is AlertTimeSlot =>
    typeof slot === "string" && ALERT_TIME_SLOTS.includes(slot as AlertTimeSlot),
  );
}

function parseAlertCondition(value: unknown, index: number): AlertCondition | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const id =
    typeof raw.id === "string" && raw.id.trim()
      ? raw.id.trim()
      : `legacy_${index}`;
  return {
    id,
    enabled: raw.enabled !== false,
    days: parseDays(raw.days),
    timeSlots: parseTimeSlots(raw.timeSlots),
  };
}

/** 구형 { days, daysMode, timeSlots } → 조건 배열 */
function legacyToConditions(raw: Record<string, unknown>): AlertCondition[] {
  const days = parseDays(raw.days);
  const timeSlots = parseTimeSlots(raw.timeSlots);
  const daysMode = raw.daysMode === "and" ? "and" : "or";

  // OR + 여러 요일 → 요일별 카드로 쪼개서 의미 유지
  if (daysMode === "or" && days.length > 1) {
    return days.map((day, index) =>
      defaultAlertCondition({
        id: `legacy_or_${index}`,
        enabled: true,
        days: [day],
        timeSlots,
      }),
    );
  }

  return [
    defaultAlertCondition({
      id: "legacy_0",
      enabled: true,
      days,
      timeSlots,
    }),
  ];
}

export function parseJobTypeAlertPreference(value: unknown): JobTypeAlertPreference {
  const fallback = defaultJobTypeAlertPreference();
  if (!value || typeof value !== "object") return fallback;

  const raw = value as Record<string, unknown>;
  let conditions: AlertCondition[] = [];

  if (Array.isArray(raw.conditions)) {
    conditions = raw.conditions
      .map((item, index) => parseAlertCondition(item, index))
      .filter((item): item is AlertCondition => item !== null)
      .slice(0, MAX_ALERT_CONDITIONS);
  } else if ("days" in raw || "timeSlots" in raw || "daysMode" in raw) {
    conditions = legacyToConditions(raw).slice(0, MAX_ALERT_CONDITIONS);
  }

  if (conditions.length === 0) {
    conditions = [defaultAlertCondition({ id: "default_0" })];
  }

  return {
    enabled: raw.enabled !== false,
    conditions,
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

/** 요일: 빈 배열이면 상관없음. 있으면 선택한 요일이 공고에 모두 포함(AND) */
export function matchesDays(postDays: string[], condition: Pick<AlertCondition, "days">): boolean {
  if (condition.days.length === 0) return true;
  return condition.days.every((day) => postDays.includes(day));
}

/** 시간대: 빈 배열이면 상관없음. 있으면 하나라도 겹치면(OR) */
export function matchesTimeSlots(
  postTimeSlots: string[],
  condition: Pick<AlertCondition, "timeSlots">,
): boolean {
  if (condition.timeSlots.length === 0) return true;
  return condition.timeSlots.some((slot) => postTimeSlots.includes(slot));
}

export function matchesAlertCondition(
  condition: AlertCondition,
  input: { days: string[]; timeSlots: string[] },
): boolean {
  if (!condition.enabled) return false;
  return matchesDays(input.days, condition) && matchesTimeSlots(input.timeSlots, condition);
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
  return preference.conditions.some((condition) => matchesAlertCondition(condition, input));
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
