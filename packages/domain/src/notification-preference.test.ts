import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clockTimeToAlertSlot,
  dateToKoreanWeekday,
  matchesDays,
  matchesNotificationPreference,
  matchesNotificationRule,
  matchesTimeSlots,
  parseNotificationPreference,
} from "./notification-preference.js";

test("rule matches region + jobType + days AND + time OR", () => {
  const rule = {
    id: "1",
    enabled: true,
    jobType: "regular" as const,
    sido: "서울특별시",
    sigungu: "강남구",
    days: ["월", "수", "금"],
    timeSlots: ["morning" as const],
  };

  assert.equal(
    matchesNotificationRule(rule, {
      jobType: "regular",
      sido: "서울특별시",
      sigungu: "강남구",
      days: ["월", "수", "금"],
      timeSlots: ["morning", "evening"],
    }),
    true,
  );
  assert.equal(
    matchesNotificationRule(rule, {
      jobType: "regular",
      sido: "서울특별시",
      sigungu: "강북구",
      days: ["월", "수", "금"],
      timeSlots: ["morning"],
    }),
    false,
  );
  assert.equal(
    matchesNotificationRule(rule, {
      jobType: "substitute",
      sido: "서울특별시",
      sigungu: "강남구",
      days: ["월", "수", "금"],
      timeSlots: ["morning"],
    }),
    false,
  );
  assert.equal(
    matchesNotificationRule(rule, {
      jobType: "regular",
      sido: "서울특별시",
      sigungu: "강남구",
      days: ["월", "금"],
      timeSlots: ["morning"],
    }),
    false,
  );
});

test("multiple rules OR; empty days/time mean any", () => {
  const preference = parseNotificationPreference({
    enabled: true,
    rulesJson: [
      {
        id: "a",
        enabled: true,
        jobType: "regular",
        sido: "서울특별시",
        sigungu: "강남구",
        days: ["월", "수", "금"],
        timeSlots: [],
      },
      {
        id: "b",
        enabled: true,
        jobType: "regular",
        sido: "서울특별시",
        sigungu: "강북구",
        days: ["화", "목"],
        timeSlots: ["evening"],
      },
    ],
  });

  assert.equal(
    matchesNotificationPreference(preference, {
      jobType: "regular",
      sido: "서울특별시",
      sigungu: "강남구",
      days: ["월", "수", "금", "토"],
      timeSlots: ["afternoon"],
    }),
    true,
  );
  assert.equal(
    matchesNotificationPreference(preference, {
      jobType: "regular",
      sido: "서울특별시",
      sigungu: "강북구",
      days: ["화", "목"],
      timeSlots: ["evening"],
    }),
    true,
  );
  assert.equal(
    matchesNotificationPreference(preference, {
      jobType: "regular",
      sido: "서울특별시",
      sigungu: "강북구",
      days: ["화", "목"],
      timeSlots: ["morning"],
    }),
    false,
  );
});

test("legacy preference expands with interest regions", () => {
  const preference = parseNotificationPreference(
    {
      enabled: true,
      regularJson: {
        enabled: true,
        days: ["월", "화"],
        daysMode: "or",
        timeSlots: ["evening"],
      },
      substituteJson: { enabled: false, days: [], timeSlots: [] },
    },
    [
      { sido: "서울특별시", sigungu: "강남구" },
      { sido: "서울특별시", sigungu: "강북구" },
    ],
  );

  // OR 월/화 → 조건 2개 × 지역 2곳 = 4
  assert.equal(preference.rules.length, 4);
  assert.equal(
    matchesNotificationPreference(preference, {
      jobType: "regular",
      sido: "서울특별시",
      sigungu: "강북구",
      days: ["화"],
      timeSlots: ["evening"],
    }),
    true,
  );
});

test("empty days/timeSlots mean allow all", () => {
  assert.equal(matchesDays(["금"], { days: [] }), true);
  assert.equal(matchesTimeSlots(["evening"], { timeSlots: [] }), true);
});

test("clock and weekday helpers", () => {
  assert.equal(clockTimeToAlertSlot("10:30"), "morning");
  assert.equal(clockTimeToAlertSlot("12:00"), "afternoon");
  assert.equal(clockTimeToAlertSlot("16:59"), "afternoon");
  assert.equal(clockTimeToAlertSlot("17:00"), "evening");
  assert.equal(clockTimeToAlertSlot("19:00"), "evening");
  assert.equal(dateToKoreanWeekday("2026-08-24"), "월");
  assert.equal(dateToKoreanWeekday("2026-08-29"), "토");
});
