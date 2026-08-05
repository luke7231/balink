import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clockTimeToAlertSlot,
  dateToKoreanWeekday,
  matchesDays,
  matchesJobTypeAlert,
  matchesRegion,
  matchesTimeSlots,
  parseJobTypeAlertPreference,
} from "./notification-preference.js";

test("days OR/AND matching", () => {
  const base = parseJobTypeAlertPreference({
    enabled: true,
    days: ["월", "화"],
    daysMode: "or",
    timeSlots: [],
  });
  assert.equal(matchesDays(["화", "목"], base), true);
  assert.equal(matchesDays(["수", "금"], base), false);

  const andMode = { ...base, daysMode: "and" as const };
  assert.equal(matchesDays(["월", "화", "수"], andMode), true);
  assert.equal(matchesDays(["화", "목"], andMode), false);
});

test("empty days/timeSlots mean allow all", () => {
  const pref = parseJobTypeAlertPreference({ enabled: true, days: [], timeSlots: [] });
  assert.equal(matchesDays(["금"], pref), true);
  assert.equal(matchesTimeSlots(["evening"], pref), true);
});

test("time slot and region matching", () => {
  const pref = parseJobTypeAlertPreference({
    enabled: true,
    days: ["월"],
    daysMode: "or",
    timeSlots: ["evening"],
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
  assert.equal(matchesRegion([{ sido: "경기도", sigungu: "성남시" }], { sido: "서울특별시", sigungu: "강남구" }), false);
});

test("clock and weekday helpers", () => {
  assert.equal(clockTimeToAlertSlot("10:30"), "morning");
  assert.equal(clockTimeToAlertSlot("14:00"), "afternoon");
  assert.equal(clockTimeToAlertSlot("19:00"), "evening");
  assert.equal(dateToKoreanWeekday("2026-08-24"), "월");
  assert.equal(dateToKoreanWeekday("2026-08-29"), "토");
});
