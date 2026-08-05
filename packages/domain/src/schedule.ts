export const SCHEDULE_DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;

export type ScheduleTimeSlot = "morning" | "afternoon" | "evening" | "negotiable" | "unknown";

export interface ScheduleTimeRange {
  start: string | null;
  end: string | null;
  raw: string | null;
}

export interface JobSchedule {
  days: string[];
  dayGroups: string[][];
  dayRaw: string | null;
  timeSlots: ScheduleTimeSlot[];
  times: ScheduleTimeRange[];
  classCount: number | null;
  durationMinutes: number | null;
  startDate: string | null;
  evidence?: string | null;
}

export const DISPLAY_TIME_SLOTS: ScheduleTimeSlot[] = ["morning", "afternoon", "evening"];

export const SCHEDULE_LLM_RULES = [
  "schedule 추출 원칙 (급여 representativePay와 같이 원문을 먼저 읽고 확정한다):",
  "- 제목(title)과 본문(detailText)을 함께 본다. 시간대 단서가 제목에만 있을 수 있다.",
  "- dayGroups: 지원 단위(한 명이 맡는 요일 묶음). 그룹끼리는 OR(택1), 그룹 안은 AND(모두 수행).",
  "- 기본은 한 포지션이다. 요일별 수업이 나열돼도 한 사람이 다 하는 일정이면 그룹 하나로 합친다.",
  "  예: 제목 '월 수 목' + 본문 '월수 19:00 / 목 19:30' → [[\"월\",\"수\",\"목\"]]. 월수와 목을 쪼개지 말 것.",
  "- 진짜 대안(지원자가 묶음 중 하나만 고름)일 때만 여러 그룹으로 나눈다.",
  "  단서: 요일묶음 사이 '/', 'or', '또는', '나', '선택', '택1'. 예 월수금/화목/토, 수금 or 화목, 월수·화목 선택.",
  "- '한요일만 지원가능', '하루만 가능'처럼 요일별 단독 지원이면 각 요일을 단독 그룹으로 둔다.",
  "  예: 화·목 수업 + '(한요일만 지원가능)' → [[\"화\"],[\"목\"]].",
  "- days: dayGroups의 합집합(정렬).",
  "- times: 수업 시작/끝을 24시간 HH:mm으로 넣는다.",
  "- 12시간제: 제목·본문에 '오전'이 없는 1~11시 표기는 기본적으로 +12(PM). 새벽이 아니다.",
  "- '오전'/'아침'이 붙은 구간만 AM. '오후'/'저녁'/'밤'(제목 포함)은 PM 확정에 사용.",
  "- 같은 공고에 오전·저녁이 섞이면 구간별로 적용.",
  "- timeSlots는 키워드가 아니라 보정된 times 구간의 겹침으로 넣는다.",
  "  morning 05:00~11:59 / afternoon 12:00~16:59 / evening 17:00~23:59.",
  "  예: 저녁 4:30-5:30 → 16:30~17:30 → afternoon+evening 둘 다.",
  "  시각이 없고 단어만 '저녁'이면 evening만.",
  "- schedule.evidence에 판단에 쓴 원문 구절을 남긴다.",
].join("\n");

/** 한 요일만 단독 지원 (가능한의 '한'과 구분) */
const SINGLE_DAY_APPLICATION_RE =
  /(?<![가-힣])한\s*요일만|하루만\s*(?:지원|가능)|가능한\s*요일만/;

const DAY_CHAR = "[월화수목금토일]";
const DAY_RUN = `${DAY_CHAR}(?:\\s*[,，·]\\s*${DAY_CHAR}){0,6}`;
/** 요일 묶음 대안: 월수금/화목, 수,금 or 화,목, 월수나 화목, 월수,화목 선택 등 */
const DAY_GROUP_ALTERNATIVE_RE = new RegExp(
  [
    // 수,금 오전or화,목 / 월수금/화목 / 월,수나 화,목
    `${DAY_RUN}[^월화수목금토일\\n]{0,12}(?:[\\/／]|\\bor\\b|또는|혹은|나)\\s*${DAY_CHAR}`,
    `${DAY_RUN}\\s*[,，]\\s*${DAY_RUN}\\s*선택`,
    `요일[^\\n]{0,40}선택`,
    `택\\s*1|택일|중\\s*(?:선택|택)`,
  ].join("|"),
  "i",
);

export function hasDayGroupAlternativeCue(text: string): boolean {
  return DAY_GROUP_ALTERNATIVE_RE.test(text);
}

export function hasSingleDayApplicationCue(text: string): boolean {
  return SINGLE_DAY_APPLICATION_RE.test(text);
}

/** LLM dayGroups를 원문 단서로 보정: 기본 합침, 한요일만→분리, 대안 단서면 유지 */
export function refineDayGroups(dayGroups: string[][], text: string): string[][] {
  const groups = normalizeDayGroups(dayGroups);
  if (groups.length === 0) return groups;

  if (hasSingleDayApplicationCue(text)) {
    return flattenDayGroups(groups).map((day) => [day]);
  }

  if (!hasDayGroupAlternativeCue(text) && groups.length > 1) {
    return [flattenDayGroups(groups)];
  }

  return groups;
}

const DAY_ORDER = new Map<string, number>(SCHEDULE_DAYS.map((day, index) => [day, index]));

export function displayableTimeSlots(slots: readonly string[]): string[] {
  return slots.filter((slot) => DISPLAY_TIME_SLOTS.includes(slot as ScheduleTimeSlot));
}

export function formatDayGroups(
  dayGroups: string[][] | null | undefined,
  days: string[] | null | undefined = [],
): string {
  const groups = normalizeDayGroups(dayGroups);
  if (groups.length > 0) {
    return groups.map((group) => group.join("·")).join(" / ");
  }
  const flat = normalizeDays(days);
  return flat.length > 0 ? flat.join(" · ") : "요일 미상";
}

export function normalizeDays(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const days = value.filter(
    (day): day is string =>
      typeof day === "string" && (SCHEDULE_DAYS as readonly string[]).includes(day),
  );
  return sortDays([...new Set(days)]);
}

export function normalizeDayGroups(value: unknown): string[][] {
  if (!Array.isArray(value)) return [];
  const groups: string[][] = [];
  for (const item of value) {
    const group = normalizeDays(item);
    if (group.length === 0) continue;
    const key = group.join(",");
    if (groups.some((existing) => existing.join(",") === key)) continue;
    groups.push(group);
  }
  return groups;
}

export function flattenDayGroups(dayGroups: string[][]): string[] {
  return sortDays([...new Set(dayGroups.flat())]);
}

function sortDays(days: string[]): string[] {
  return [...days].sort((a, b) => (DAY_ORDER.get(a) ?? 99) - (DAY_ORDER.get(b) ?? 99));
}

export function parseHhmm(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

export function formatHhmm(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** 수업 구간이 걸치는 오전/오후/저녁 슬롯 (겹치는 대역 전부) */
export function timeRangeToAlertSlots(
  startHhmm: string | null,
  endHhmm: string | null,
): Array<"morning" | "afternoon" | "evening"> {
  const start = parseHhmm(startHhmm);
  if (start == null) return [];
  let end = parseHhmm(endHhmm);
  if (end == null || end <= start) end = start + 1;

  const slots = new Set<"morning" | "afternoon" | "evening">();
  // [start, end) 분 단위로 대역 겹침 검사
  const ranges: Array<{ slot: "morning" | "afternoon" | "evening"; from: number; to: number }> = [
    { slot: "morning", from: 5 * 60, to: 12 * 60 },
    { slot: "afternoon", from: 12 * 60, to: 17 * 60 },
    { slot: "evening", from: 17 * 60, to: 24 * 60 },
  ];
  for (const range of ranges) {
    if (start < range.to && end > range.from) slots.add(range.slot);
  }
  // 새벽 0~5시는 evening으로 보지 않고, 보정 실패로 morning에 가깝게 두지 않음 — 보통 +12 후라 거의 없음
  if (slots.size === 0 && start < 5 * 60) slots.add("evening");
  return [...slots];
}

export function hasMorningCue(text: string): boolean {
  return /오전|아침|\bAM\b/i.test(text);
}

export function hasPmCue(text: string): boolean {
  return /오후|저녁|밤|\bPM\b/i.test(text);
}

/**
 * 1~11시 표기를 PM(+12)으로 볼지 결정.
 * 원문(제목+본문)에 오전이 없으면 기본 PM. 오전 큐가 있으면 강제하지 않음(구간별 LLM 판단 존중하되 sanitize는 보수적으로 +12).
 */
export function shouldDefaultToPm(combinedText: string): boolean {
  return !hasMorningCue(combinedText);
}

export function applyPmOffsetIfNeeded(
  hhmm: string | null,
  combinedText: string,
  rawHint: string | null = null,
): string | null {
  const minutes = parseHhmm(hhmm);
  if (minutes == null) return hhmm;
  const hour = Math.floor(minutes / 60);
  if (hour >= 12) return formatHhmm(minutes);
  if (hour === 0) return formatHhmm(minutes);

  // 해당 시각 raw에 오전이 있으면 AM 유지
  if (rawHint && /오전|아침|\bAM\b/i.test(rawHint)) return formatHhmm(minutes);

  // 1~8시: 발레 공고에서 거의 저녁 (5시·7시·8시 수업)
  if (hour >= 1 && hour <= 8) return formatHhmm(minutes + 12 * 60);

  // 9~11시: 기본은 오전/낮 수업. 저녁·오후 단서만 있고 오전이 없을 때만 +12
  if (hour >= 9 && hour <= 11) {
    if (!hasMorningCue(combinedText) && hasPmCue(combinedText)) {
      return formatHhmm(minutes + 12 * 60);
    }
    return formatHhmm(minutes);
  }

  return formatHhmm(minutes);
}

export function normalizeScheduleTime(
  time: ScheduleTimeRange,
  combinedText: string,
): ScheduleTimeRange {
  const hint = `${time.raw ?? ""}`;
  const start = applyPmOffsetIfNeeded(normalizeLooseHhmm(time.start), combinedText, hint);
  const end = applyPmOffsetIfNeeded(normalizeLooseHhmm(time.end), combinedText, hint);
  // end가 start보다 작으면 end에도 +12가 안 먹었거나 자정 넘어감 — end만 추가 보정
  const startMin = parseHhmm(start);
  const endMin = parseHhmm(end);
  let fixedEnd = end;
  if (startMin != null && endMin != null && endMin <= startMin && endMin < 12 * 60) {
    fixedEnd = formatHhmm(endMin + 12 * 60);
  }
  return {
    start,
    end: fixedEnd,
    raw: time.raw,
  };
}

function normalizeLooseHhmm(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const match = /^(\d{1,2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  if (!Number.isFinite(hour) || hour > 23 || minute > 59) return null;
  return formatHhmm(hour * 60 + minute);
}

export function deriveTimeSlotsFromTimes(
  times: ScheduleTimeRange[],
  fallbackSlots: ScheduleTimeSlot[] = [],
): ScheduleTimeSlot[] {
  const slots = new Set<ScheduleTimeSlot>();
  for (const time of times) {
    for (const slot of timeRangeToAlertSlots(time.start, time.end)) {
      slots.add(slot);
    }
  }
  if (slots.size > 0) {
    // negotiable은 times와 함께 유지 가능
    if (fallbackSlots.includes("negotiable")) slots.add("negotiable");
    return orderTimeSlots([...slots]);
  }
  return orderTimeSlots(
    fallbackSlots.filter((slot) =>
      ["morning", "afternoon", "evening", "negotiable", "unknown"].includes(slot),
    ),
  );
}

function orderTimeSlots(slots: ScheduleTimeSlot[]): ScheduleTimeSlot[] {
  const order: ScheduleTimeSlot[] = ["morning", "afternoon", "evening", "negotiable", "unknown"];
  return order.filter((slot) => slots.includes(slot));
}

export function sanitizeSchedule(
  input: Partial<JobSchedule> | null | undefined,
  context: { title?: string | null; detailText?: string | null },
): JobSchedule {
  const combinedText = `${context.title ?? ""}\n${context.detailText ?? ""}`;
  let dayGroups = normalizeDayGroups(input?.dayGroups);
  let days = normalizeDays(input?.days);

  if (dayGroups.length === 0 && days.length > 0) {
    dayGroups = [days];
  }
  dayGroups = refineDayGroups(dayGroups, combinedText);
  if (dayGroups.length > 0) {
    days = flattenDayGroups(dayGroups);
  }

  const rawTimes = Array.isArray(input?.times) ? input!.times! : [];
  const times = rawTimes
    .map((time) =>
      normalizeScheduleTime(
        {
          start: typeof time?.start === "string" ? time.start : null,
          end: typeof time?.end === "string" ? time.end : null,
          raw: typeof time?.raw === "string" ? time.raw : null,
        },
        combinedText,
      ),
    )
    .filter((time) => time.start || time.end || time.raw);

  const incomingSlots = Array.isArray(input?.timeSlots)
    ? (input!.timeSlots!.filter((slot): slot is ScheduleTimeSlot => typeof slot === "string") as ScheduleTimeSlot[])
    : [];

  let timeSlots = deriveTimeSlotsFromTimes(times, incomingSlots);

  // times가 있는데 morning만 남아 있고 보정 후 evening이어야 하는 경우 derive가 처리함
  // times 없고 키워드만 있으면 incoming/키워드 사용
  if (times.length === 0) {
    const keywordSlots = new Set<ScheduleTimeSlot>();
    if (/오전/.test(combinedText)) keywordSlots.add("morning");
    if (/오후/.test(combinedText)) keywordSlots.add("afternoon");
    if (/저녁|밤/.test(combinedText)) keywordSlots.add("evening");
    if (/협의|조절가능|가능한 시간대/.test(combinedText)) keywordSlots.add("negotiable");
    if (keywordSlots.size > 0) {
      timeSlots = orderTimeSlots([...keywordSlots]);
    } else if (timeSlots.length === 0) {
      timeSlots = ["unknown"];
    }
  }

  return {
    days,
    dayGroups,
    dayRaw: typeof input?.dayRaw === "string" ? input.dayRaw : days.join(","),
    timeSlots,
    times,
    classCount: typeof input?.classCount === "number" ? input.classCount : null,
    durationMinutes: typeof input?.durationMinutes === "number" ? input.durationMinutes : null,
    startDate: typeof input?.startDate === "string" ? input.startDate : null,
    evidence: typeof input?.evidence === "string" ? input.evidence : null,
  };
}

/** 알림 매칭: dayGroups가 있으면 그룹 단위 AND, 없으면 flat days */
export function matchesPostDays(
  preferenceDays: string[],
  post: { days?: string[]; dayGroups?: string[][] },
  mode: "and" | "or" = "and",
): boolean {
  if (preferenceDays.length === 0) return true;

  const groups = normalizeDayGroups(post.dayGroups);
  const candidates = groups.length > 0 ? groups : [normalizeDays(post.days)];

  if (mode === "or") {
    return preferenceDays.some((day) => candidates.some((group) => group.includes(day)));
  }
  return candidates.some((group) => preferenceDays.every((day) => group.includes(day)));
}
