import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JOB_MATCH_NOTIFICATION_TITLE,
  SUBSTITUTE_MATCH_NOTIFICATION_TITLE,
  clockTimeToAlertSlot,
  dateToKoreanWeekday,
  formatJobMatchNotificationBody,
  formatLessonDateLabel,
  formatSubstituteMatchNotificationBody,
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

test("any-day regular rules match existing Gangnam/Songpa/Gangdong jobs", () => {
  const preference = parseNotificationPreference({
    enabled: true,
    rulesJson: [
      { id: "1", enabled: true, jobType: "regular", sido: "서울특별시", sigungu: "강남구", days: [], timeSlots: [] },
      { id: "2", enabled: true, jobType: "regular", sido: "서울특별시", sigungu: "송파구", days: [], timeSlots: [] },
      { id: "3", enabled: true, jobType: "regular", sido: "서울특별시", sigungu: "강동구", days: [], timeSlots: [] },
    ],
  });

  assert.equal(
    matchesNotificationPreference(preference, {
      jobType: "regular",
      sido: "서울특별시",
      sigungu: "강동구",
      days: ["수", "금"],
      timeSlots: ["evening"],
    }),
    true,
  );
  assert.equal(
    matchesNotificationPreference(preference, {
      jobType: "regular",
      sido: "서울특별시",
      sigungu: "구로구",
      days: ["월"],
      timeSlots: ["evening"],
    }),
    false,
  );
  assert.equal(
    matchesNotificationPreference(preference, {
      jobType: "substitute",
      sido: "서울특별시",
      sigungu: "강남구",
      days: ["목"],
      timeSlots: ["morning"],
    }),
    false,
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

test("inbox notification titles and body formatting", () => {
  assert.equal(JOB_MATCH_NOTIFICATION_TITLE, "📢 관심 조건에 딱 맞는 공고가 올라왔어요");
  assert.equal(SUBSTITUTE_MATCH_NOTIFICATION_TITLE, "⚡ 관심 조건에 딱 맞는 대강이 올라왔어요");
  assert.equal(formatLessonDateLabel("2026-03-12"), "3/12(목)");
  assert.equal(
    formatJobMatchNotificationBody({
      sigungu: "성북구",
      days: ["월", "수", "금"],
      timeSlots: ["evening"],
    }),
    "성북구 · 월수금 · 🌙 저녁",
  );
  assert.equal(
    formatSubstituteMatchNotificationBody({
      sigungu: "성북구",
      lessonDates: ["2026-03-12"],
      timeSlots: ["evening"],
    }),
    "성북구 · 3/12(목) · 🌙 저녁",
  );
});
