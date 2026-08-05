import { TIME_SLOT_LABELS } from "./enums.js";
import { formatSidoForDisplay } from "./location/display.js";
import { matchesPostDays } from "./schedule.js";

export type AlertTimeSlot = "morning" | "afternoon" | "evening";
export type AlertJobType = "regular" | "substitute";

export const ALERT_DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
export const ALERT_TIME_SLOTS: AlertTimeSlot[] = ["morning", "afternoon", "evening"];
export const MAX_NOTIFICATION_RULES = 8;

/** @deprecated 하위 호환 파싱용 */
export type DaysMode = "or" | "and";

export interface NotificationRule {
  id: string;
  enabled: boolean;
  jobType: AlertJobType;
  sido: string;
  sigungu: string;
  /** 빈 배열 = 요일 상관없음. 있으면 AND */
  days: string[];
  /** 빈 배열 = 시간대 상관없음. 있으면 OR */
  timeSlots: AlertTimeSlot[];
}

export interface NotificationPreference {
  enabled: boolean;
  rules: NotificationRule[];
}

export function formatNotificationRuleSummary(rule: NotificationRule): string {
  const kind = rule.jobType === "regular" ? "정규" : "대타";
  const region =
    rule.sido && rule.sigungu
      ? `${formatSidoForDisplay(rule.sido)} ${rule.sigungu}`
      : "지역 미선택";
  const dayText =
    rule.days.length === 0 ? "요일 상관없음" : `${rule.days.join("·")} 모두`;
  const timeText =
    rule.timeSlots.length === 0
      ? "시간 상관없음"
      : rule.timeSlots.map((slot) => TIME_SLOT_LABELS[slot] ?? slot).join("·");
  return `${region} · ${kind} · ${dayText} · ${timeText}`;
}

/** 아직 지역을 고르지 않은 기본 빈 규칙만 있는지 */
export function isBlankNotificationPreference(preference: NotificationPreference): boolean {
  if (preference.rules.length !== 1) return false;
  const rule = preference.rules[0];
  if (!rule) return true;
  return (
    !rule.sido &&
    !rule.sigungu &&
    rule.days.length === 0 &&
    rule.timeSlots.length === 0
  );
}

/** @deprecated 레거시 조건 카드 */
export interface AlertCondition {
  id: string;
  enabled: boolean;
  days: string[];
  timeSlots: AlertTimeSlot[];
}

/** @deprecated 레거시 정규/대타 묶음 */
export interface JobTypeAlertPreference {
  enabled: boolean;
  conditions: AlertCondition[];
}

let ruleSeq = 0;

export function createNotificationRuleId(): string {
  ruleSeq += 1;
  return `r_${Date.now().toString(36)}_${ruleSeq.toString(36)}`;
}

export function defaultNotificationRule(
  partial?: Partial<Omit<NotificationRule, "id">> & { id?: string },
): NotificationRule {
  return {
    id: partial?.id ?? createNotificationRuleId(),
    enabled: partial?.enabled !== false,
    jobType: partial?.jobType === "substitute" ? "substitute" : "regular",
    sido: partial?.sido ?? "",
    sigungu: partial?.sigungu ?? "",
    days: partial?.days ?? [],
    timeSlots: partial?.timeSlots ?? [],
  };
}

export function defaultNotificationPreference(): NotificationPreference {
  return {
    enabled: true,
    rules: [defaultNotificationRule({ id: "default_0" })],
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

function parseNotificationRule(value: unknown, index: number): NotificationRule | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const id =
    typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `legacy_rule_${index}`;
  const sido = typeof raw.sido === "string" ? raw.sido.trim() : "";
  const sigungu = typeof raw.sigungu === "string" ? raw.sigungu.trim() : "";
  return {
    id,
    enabled: raw.enabled !== false,
    jobType: raw.jobType === "substitute" ? "substitute" : "regular",
    sido,
    sigungu,
    days: parseDays(raw.days),
    timeSlots: parseTimeSlots(raw.timeSlots),
  };
}

function parseAlertCondition(value: unknown, index: number): AlertCondition | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const id =
    typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `legacy_${index}`;
  return {
    id,
    enabled: raw.enabled !== false,
    days: parseDays(raw.days),
    timeSlots: parseTimeSlots(raw.timeSlots),
  };
}

function legacyConditionsFromJobType(raw: Record<string, unknown>): AlertCondition[] {
  if (Array.isArray(raw.conditions)) {
    return raw.conditions
      .map((item, index) => parseAlertCondition(item, index))
      .filter((item): item is AlertCondition => item !== null);
  }

  const days = parseDays(raw.days);
  const timeSlots = parseTimeSlots(raw.timeSlots);
  const daysMode = raw.daysMode === "and" ? "and" : "or";

  if (daysMode === "or" && days.length > 1) {
    return days.map((day, index) => ({
      id: `legacy_or_${index}`,
      enabled: true,
      days: [day],
      timeSlots,
    }));
  }

  return [
    {
      id: "legacy_0",
      enabled: true,
      days,
      timeSlots,
    },
  ];
}

/** @deprecated */
export function parseJobTypeAlertPreference(value: unknown): JobTypeAlertPreference {
  if (!value || typeof value !== "object") {
    return { enabled: true, conditions: [{ id: "default_0", enabled: true, days: [], timeSlots: [] }] };
  }
  const raw = value as Record<string, unknown>;
  const conditions = legacyConditionsFromJobType(raw);
  return {
    enabled: raw.enabled !== false,
    conditions:
      conditions.length > 0
        ? conditions
        : [{ id: "default_0", enabled: true, days: [], timeSlots: [] }],
  };
}

function expandLegacyRules(
  jobType: AlertJobType,
  jobPref: JobTypeAlertPreference,
  interestRegions: Array<{ sido: string; sigungu: string }>,
): NotificationRule[] {
  if (!jobPref.enabled) return [];

  const regions =
    interestRegions.length > 0
      ? interestRegions
      : [{ sido: "", sigungu: "" }];

  const rules: NotificationRule[] = [];
  for (const condition of jobPref.conditions) {
    if (!condition.enabled) continue;
    for (const [regionIndex, region] of regions.entries()) {
      rules.push(
        defaultNotificationRule({
          id: `${jobType}_${condition.id}_${regionIndex}`,
          enabled: true,
          jobType,
          sido: region.sido,
          sigungu: region.sigungu,
          days: condition.days,
          timeSlots: condition.timeSlots,
        }),
      );
    }
  }
  return rules;
}

export function parseNotificationPreference(
  input: {
    enabled?: boolean | null;
    rulesJson?: unknown;
    regularJson?: unknown;
    substituteJson?: unknown;
  } | null | undefined,
  interestRegions: Array<{ sido: string; sigungu: string }> = [],
): NotificationPreference {
  if (!input) return defaultNotificationPreference();

  // 빈 배열은 미이관으로 보고 레거시 regular/substitute를 펼친다
  if (Array.isArray(input.rulesJson) && input.rulesJson.length > 0) {
    const rules = input.rulesJson
      .map((item, index) => parseNotificationRule(item, index))
      .filter((item): item is NotificationRule => item !== null)
      .slice(0, MAX_NOTIFICATION_RULES);
    return {
      enabled: input.enabled !== false,
      rules: rules.length > 0 ? rules : [defaultNotificationRule({ id: "default_0" })],
    };
  }

  const regular = parseJobTypeAlertPreference(input.regularJson);
  const substitute = parseJobTypeAlertPreference(input.substituteJson);
  const rules = [
    ...expandLegacyRules("regular", regular, interestRegions),
    ...expandLegacyRules("substitute", substitute, interestRegions),
  ].slice(0, MAX_NOTIFICATION_RULES);

  return {
    enabled: input.enabled !== false,
    rules: rules.length > 0 ? rules : [defaultNotificationRule({ id: "default_0" })],
  };
}

/** 요일: 빈 배열이면 상관없음. 있으면 선택한 요일이 공고에 모두 포함(AND) */
export function matchesDays(postDays: string[], condition: { days: string[] }): boolean {
  if (condition.days.length === 0) return true;
  return condition.days.every((day) => postDays.includes(day));
}

/** 시간대: 빈 배열이면 상관없음. 있으면 하나라도 겹치면(OR) */
export function matchesTimeSlots(
  postTimeSlots: string[],
  condition: { timeSlots: AlertTimeSlot[] | string[] },
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

export function matchesNotificationRule(
  rule: NotificationRule,
  input: {
    jobType: AlertJobType;
    sido?: string | null;
    sigungu?: string | null;
    days: string[];
    dayGroups?: string[][];
    timeSlots: string[];
  },
): boolean {
  if (!rule.enabled) return false;
  if (rule.jobType !== input.jobType) return false;
  if (!rule.sido || !rule.sigungu) return false;
  if (rule.sido !== input.sido || rule.sigungu !== input.sigungu) return false;
  const daysOk =
    rule.days.length === 0
      ? true
      : matchesPostDays(rule.days, { days: input.days, dayGroups: input.dayGroups }, "and");
  return daysOk && matchesTimeSlots(input.timeSlots, rule);
}

export function matchesNotificationPreference(
  preference: NotificationPreference,
  input: {
    jobType: AlertJobType;
    sido?: string | null;
    sigungu?: string | null;
    days: string[];
    dayGroups?: string[][];
    timeSlots: string[];
  },
): boolean {
  if (!preference.enabled) return false;
  return preference.rules.some((rule) => matchesNotificationRule(rule, input));
}

/** @deprecated 규칙 배열 모델로 대체됨 */
export function matchesJobTypeAlert(
  preference: JobTypeAlertPreference,
  input: { days: string[]; timeSlots: string[] },
): boolean {
  if (!preference.enabled) return false;
  return preference.conditions.some((condition) => matchesAlertCondition(condition, input));
}

/**
 * 시계열 시각을 오전/오후/저녁으로 환산 (대타 매칭·크롤링 룰과 동일)
 * - morning: 00:00~11:59
 * - afternoon: 12:00~16:59
 * - evening: 17:00~23:59
 */
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

/** @deprecated */
export function defaultJobTypeAlertPreference(): JobTypeAlertPreference {
  return {
    enabled: true,
    conditions: [{ id: "default_0", enabled: true, days: [], timeSlots: [] }],
  };
}

/** @deprecated */
export function defaultAlertCondition(
  partial?: Partial<Omit<AlertCondition, "id">> & { id?: string },
): AlertCondition {
  return {
    id: partial?.id ?? createNotificationRuleId(),
    enabled: partial?.enabled !== false,
    days: partial?.days ?? [],
    timeSlots: partial?.timeSlots ?? [],
  };
}

/** @deprecated */
export function createAlertConditionId(): string {
  return createNotificationRuleId();
}

/** @deprecated */
export const MAX_ALERT_CONDITIONS = MAX_NOTIFICATION_RULES;
