import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatCompactLessonDate,
  formatJobType,
  formatLessonDates,
  formatRecurrenceSummary,
  formatSubstituteSessionLabel,
  formatSubstituteSessionsCardLabel,
  groupSubstituteSessionsByDate,
} from "./format.js";

test("formatJobType maps one_time to 특강", () => {
  assert.equal(formatJobType("one_time"), "특강");
  assert.equal(formatJobType("substitute"), "대강");
  assert.equal(formatJobType("regular"), "정규");
});

test("formatCompactLessonDate omits year", () => {
  assert.equal(formatCompactLessonDate("2026-08-04"), "8/4");
  assert.equal(formatCompactLessonDate("2026-12-11"), "12/11");
});

test("formatSubstituteSessionLabel fills weekday from KST date", () => {
  assert.equal(
    formatSubstituteSessionLabel({
      date: "2026-08-04",
      day: null,
      startTime: "16:30",
      endTime: "17:10",
    }),
    "8/4 화요일 16:30~17:10",
  );
});

test("groupSubstituteSessionsByDate nests times under the same date", () => {
  const groups = groupSubstituteSessionsByDate([
    { date: "2026-08-14", day: "금", startTime: "16:00", endTime: "17:45", origin: "explicit" },
    { date: "2026-08-14", day: "금", startTime: "17:00", endTime: "17:50", origin: "explicit" },
    { date: "2026-08-14", day: "금", startTime: "18:00", endTime: "19:00", origin: "explicit" },
  ]);
  assert.deepEqual(groups, [
    {
      date: "2026-08-14",
      dateLabel: "8/14 금요일",
      times: ["16:00~17:45", "17:00~17:50", "18:00~19:00"],
    },
  ]);
});

test("formatSubstituteSessionsCardLabel lists sessions and truncates after 4", () => {
  const sessions = [
    { date: "2026-08-04", startTime: "16:30", endTime: "17:10", origin: "explicit" },
    { date: "2026-08-11", startTime: "16:30", endTime: "17:10", origin: "explicit" },
    { date: "2026-08-18", startTime: "16:30", endTime: "17:10", origin: "explicit" },
    { date: "2026-08-25", startTime: "16:30", endTime: "17:10", origin: "explicit" },
    { date: "2026-09-01", startTime: "16:30", endTime: "17:10", origin: "explicit" },
    { date: "2026-09-08", startTime: "16:30", endTime: "17:10", origin: "explicit" },
  ];
  const label = formatSubstituteSessionsCardLabel(sessions);
  assert.ok(label?.includes("8/4 화요일"));
  assert.ok(label?.includes("· 16:30~17:10"));
  assert.ok(label?.includes("외 2개"));
  assert.ok(!label?.includes("9/1"));
});

test("formatLessonDates and recurrence omit year and keep weekdays", () => {
  assert.equal(formatLessonDates(["2026-08-04", "2026-08-11"]), "8/4 화 · 8/11 화");
  assert.equal(
    formatRecurrenceSummary({
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      daysOfWeek: ["화", "목"],
      startTime: "17:00",
      endTime: "17:50",
    }),
    "8/1~8/31 화·목 17:00~17:50",
  );
});
