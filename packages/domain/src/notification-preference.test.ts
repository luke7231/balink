import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clockTimeToAlertSlot,
  dateToKoreanWeekday,
  matchesAlertCondition,
  matchesDays,
  matchesJobTypeAlert,
  matchesRegion,
  matchesTimeSlots,
  parseJobTypeAlertPreference,
} from "./notification-preference.js";

test("days are AND; empty means any day", () => {
  const condition = { days: ["월", "수", "금"], timeSlots: [] as const };
  assert.equal(matchesDays(["월", "수", "금", "토"], condition), true);
  assert.equal(matchesDays(["월", "금"], condition), false);
  assert.equal(matchesDays(["화"], { days: [] }), true);
});

test("legacy OR preference splits into multiple conditions", () => {
  const pref = parseJobTypeAlertPreference({
    enabled: true,
    days: ["월", "화"],
    daysMode: "or",
    timeSlots: ["evening"],
  });
  assert.equal(pref.conditions.length, 2);
  assert.equal(matchesJobTypeAlert(pref, { days: ["화", "목"], timeSlots: ["evening"] }), true);
  assert.equal(matchesJobTypeAlert(pref, { days: ["수", "금"], timeSlots: ["evening"] }), false);
});

test("legacy AND preference stays one condition", () => {
  const pref = parseJobTypeAlertPreference({
    enabled: true,
    days: ["월", "화"],
    daysMode: "and",
    timeSlots: [],
  });
  assert.equal(pref.conditions.length, 1);
  assert.equal(matchesDays(["월", "화", "수"], pref.conditions[0]!), true);
  assert.equal(matchesDays(["화", "목"], pref.conditions[0]!), false);
});

test("multiple conditions OR together", () => {
  const pref = parseJobTypeAlertPreference({
    enabled: true,
    conditions: [
      { id: "a", enabled: true, days: ["월", "수", "금"], timeSlots: [] },
      { id: "b", enabled: true, days: ["토"], timeSlots: ["morning"] },
    ],
  });
  assert.equal(matchesJobTypeAlert(pref, { days: ["월", "수", "금"], timeSlots: ["evening"] }), true);
  assert.equal(matchesJobTypeAlert(pref, { days: ["토"], timeSlots: ["morning"] }), true);
  assert.equal(matchesJobTypeAlert(pref, { days: ["토"], timeSlots: ["evening"] }), false);
});

test("empty days/timeSlots mean allow all", () => {
  const pref = parseJobTypeAlertPreference({
    enabled: true,
    conditions: [{ id: "any", enabled: true, days: [], timeSlots: [] }],
  });
  assert.equal(matchesDays(["금"], pref.conditions[0]!), true);
  assert.equal(matchesTimeSlots(["evening"], pref.conditions[0]!), true);
  assert.equal(matchesAlertCondition(pref.conditions[0]!, { days: ["금"], timeSlots: ["evening"] }), true);
});

test("time slot and region matching", () => {
  const pref = parseJobTypeAlertPreference({
    enabled: true,
    conditions: [{ id: "c", enabled: true, days: ["월"], timeSlots: ["evening"] }],
  });
  assert.equal(matchesJobTypeAlert(pref, { days: ["월"], timeSlots: ["morning", "evening"] }), true);
  assert.equal(matchesJobTypeAlert(pref, { days: ["월"], timeSlots: ["morning"] }), false);
  assert.equal(
    matchesRegion(
      [{ sido: "경기도", sigungu: "성남시" }],
      { sido: "경기도", sigungu: "성남시" },
    ),
    true,
  );
  assert.equal(
    matchesRegion([{ sido: "경기도", sigungu: "성남시" }], { sido: "서울특별시", sigungu: "강남구" }),
    false,
  );
});

test("clock and weekday helpers", () => {
  assert.equal(clockTimeToAlertSlot("10:30"), "morning");
  assert.equal(clockTimeToAlertSlot("14:00"), "afternoon");
  assert.equal(clockTimeToAlertSlot("19:00"), "evening");
  assert.equal(dateToKoreanWeekday("2026-08-24"), "월");
  assert.equal(dateToKoreanWeekday("2026-08-29"), "토");
});
