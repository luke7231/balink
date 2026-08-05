const SCHEDULE_DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const DAY_ORDER = new Map(SCHEDULE_DAYS.map((day, index) => [day, index]));

const SCHEDULE_LLM_RULES = [
  "schedule 추출 원칙 (급여처럼 원문을 먼저 읽고 확정한다):",
  "- 제목(title)과 본문(detailText)을 함께 본다. 시간대 단서가 제목에만 있을 수 있다.",
  "- dayGroups: 지원 단위(한 명이 맡는 요일 묶음). 그룹끼리는 OR(택1), 그룹 안은 AND(모두 수행).",
  "- 기본은 한 포지션. 요일별 수업 나열이어도 한 사람이 다 하면 그룹 하나로 합친다.",
  "  예: '월 수 목' + '월수 19:00 / 목 19:30' → [[\"월\",\"수\",\"목\"]].",
  "- 진짜 대안일 때만 여러 그룹: 요일묶음 사이 '/', '또는', '택1', '중 선택'.",
  "  예 월수금/화목/토 → [[\"월\",\"수\",\"금\"],[\"화\",\"목\"],[\"토\"]].",
  "- '한요일만 지원가능'/'하루만 가능'이면 각 요일 단독 그룹. 예 화·목+(한요일만) → [[\"화\"],[\"목\"]].",
  "- days: dayGroups의 합집합.",
  "- times: 수업 시작/끝을 24시간 HH:mm으로.",
  "- 12시간제: 제목·본문에 '오전'이 없는 1~11시 표기는 기본적으로 +12(PM). 새벽이 아니다.",
  "- '오전'/'아침' 구간만 AM. '오후'/'저녁'/'밤'(제목 포함)은 PM.",
  "- timeSlots는 보정된 times 구간의 겹침으로 넣는다 (키워드로 덮지 말 것).",
  "  morning 05:00~11:59 / afternoon 12:00~16:59 / evening 17:00~23:59.",
  "  예: 저녁 4:30-5:30 → 16:30~17:30 → afternoon+evening.",
  "- schedule.evidence에 판단에 쓴 원문 구절을 남긴다.",
].join("\n");

const SINGLE_DAY_APPLICATION_RE =
  /(?<![가-힣])한\s*요일만|하루만\s*(?:지원|가능)|가능한\s*요일만/;
const DAY_CHAR = "[월화수목금토일]";
const DAY_RUN = `${DAY_CHAR}(?:\\s*[,，·]\\s*${DAY_CHAR}){0,6}`;
const DAY_GROUP_ALTERNATIVE_RE = new RegExp(
  [
    `${DAY_RUN}[^월화수목금토일\\n]{0,12}(?:[\\/／]|\\bor\\b|또는|혹은|나)\\s*${DAY_CHAR}`,
    `${DAY_RUN}\\s*[,，]\\s*${DAY_RUN}\\s*선택`,
    `요일[^\\n]{0,40}선택`,
    `택\\s*1|택일|중\\s*(?:선택|택)`,
  ].join("|"),
  "i",
);

function refineDayGroups(dayGroups, text) {
  const groups = normalizeDayGroups(dayGroups);
  if (!groups.length) return groups;
  if (SINGLE_DAY_APPLICATION_RE.test(text)) {
    return flattenDayGroups(groups).map((day) => [day]);
  }
  if (!DAY_GROUP_ALTERNATIVE_RE.test(text) && groups.length > 1) {
    return [flattenDayGroups(groups)];
  }
  return groups;
}

function sortDays(days) {
  return [...days].sort((a, b) => (DAY_ORDER.get(a) ?? 99) - (DAY_ORDER.get(b) ?? 99));
}

function normalizeDays(value) {
  if (!Array.isArray(value)) return [];
  return sortDays([
    ...new Set(value.filter((day) => typeof day === "string" && SCHEDULE_DAYS.includes(day))),
  ]);
}

function normalizeDayGroups(value) {
  if (!Array.isArray(value)) return [];
  const groups = [];
  for (const item of value) {
    const group = normalizeDays(item);
    if (!group.length) continue;
    const key = group.join(",");
    if (groups.some((existing) => existing.join(",") === key)) continue;
    groups.push(group);
  }
  return groups;
}

function flattenDayGroups(dayGroups) {
  return sortDays([...new Set(dayGroups.flat())]);
}

function parseHhmm(value) {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value).trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function formatHhmm(totalMinutes) {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function normalizeLooseHhmm(value) {
  if (!value) return null;
  const match = /^(\d{1,2})(?::(\d{2}))?$/.exec(String(value).trim());
  if (!match) return null;
  return formatHhmm(Number(match[1]) * 60 + Number(match[2] || 0));
}

function hasMorningCue(text) {
  return /오전|아침|\bAM\b/i.test(text);
}

function hasPmCue(text) {
  return /오후|저녁|밤|\bPM\b/i.test(text);
}

function applyPmOffsetIfNeeded(hhmm, combinedText, rawHint = null) {
  const minutes = parseHhmm(hhmm);
  if (minutes == null) return hhmm;
  const hour = Math.floor(minutes / 60);
  if (hour >= 12) return formatHhmm(minutes);
  if (hour === 0) return formatHhmm(minutes);
  if (rawHint && /오전|아침|\bAM\b/i.test(rawHint)) return formatHhmm(minutes);
  // 1~8시: 발레 공고에서 거의 저녁
  if (hour >= 1 && hour <= 8) return formatHhmm(minutes + 12 * 60);
  // 9~11시: 기본 오전/낮. 저녁·오후 단서만 있을 때만 +12
  if (hour >= 9 && hour <= 11) {
    if (!hasMorningCue(combinedText) && hasPmCue(combinedText)) {
      return formatHhmm(minutes + 12 * 60);
    }
    return formatHhmm(minutes);
  }
  return formatHhmm(minutes);
}

function timeRangeToSlots(startHhmm, endHhmm) {
  const start = parseHhmm(startHhmm);
  if (start == null) return [];
  let end = parseHhmm(endHhmm);
  if (end == null || end <= start) end = start + 1;

  const slots = new Set();
  const ranges = [
    { slot: "morning", from: 5 * 60, to: 12 * 60 },
    { slot: "afternoon", from: 12 * 60, to: 17 * 60 },
    { slot: "evening", from: 17 * 60, to: 24 * 60 },
  ];
  for (const range of ranges) {
    if (start < range.to && end > range.from) slots.add(range.slot);
  }
  return [...slots];
}

function orderTimeSlots(slots) {
  return ["morning", "afternoon", "evening", "negotiable", "unknown"].filter((slot) =>
    slots.includes(slot),
  );
}

function sanitizeSchedule(input, context = {}) {
  const combinedText = `${context.title || ""}\n${context.detailText || ""}`;
  let dayGroups = normalizeDayGroups(input?.dayGroups);
  let days = normalizeDays(input?.days);

  if (!dayGroups.length && days.length) dayGroups = [days];
  dayGroups = refineDayGroups(dayGroups, combinedText);
  if (dayGroups.length) days = flattenDayGroups(dayGroups);

  const times = (Array.isArray(input?.times) ? input.times : [])
    .map((time) => {
      const hint = typeof time?.raw === "string" ? time.raw : "";
      const start = applyPmOffsetIfNeeded(normalizeLooseHhmm(time?.start), combinedText, hint);
      let end = applyPmOffsetIfNeeded(normalizeLooseHhmm(time?.end), combinedText, hint);
      const startMin = parseHhmm(start);
      const endMin = parseHhmm(end);
      if (startMin != null && endMin != null && endMin <= startMin && endMin < 12 * 60) {
        end = formatHhmm(endMin + 12 * 60);
      }
      return {
        start,
        end,
        raw: typeof time?.raw === "string" ? time.raw : null,
      };
    })
    .filter((time) => time.start || time.end || time.raw);

  const incoming = Array.isArray(input?.timeSlots) ? input.timeSlots : [];
  const slots = new Set();
  for (const time of times) {
    for (const slot of timeRangeToSlots(time.start, time.end)) slots.add(slot);
  }
  if (incoming.includes("negotiable")) slots.add("negotiable");

  let timeSlots = orderTimeSlots([...slots]);
  if (!times.length) {
    const keywordSlots = new Set();
    if (/오전/.test(combinedText)) keywordSlots.add("morning");
    if (/오후/.test(combinedText)) keywordSlots.add("afternoon");
    if (/저녁|밤/.test(combinedText)) keywordSlots.add("evening");
    if (/협의|조절가능|가능한 시간대/.test(combinedText)) keywordSlots.add("negotiable");
    timeSlots = keywordSlots.size
      ? orderTimeSlots([...keywordSlots])
      : orderTimeSlots(incoming.length ? incoming : ["unknown"]);
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

module.exports = {
  SCHEDULE_LLM_RULES,
  sanitizeSchedule,
  normalizeDayGroups,
  flattenDayGroups,
  normalizeDays,
};
