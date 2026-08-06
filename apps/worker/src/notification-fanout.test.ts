import assert from "node:assert/strict";
import test from "node:test";
import {
  JOB_MATCH_NOTIFICATION_TITLE,
  SUBSTITUTE_MATCH_NOTIFICATION_TITLE,
  formatJobMatchNotificationBody,
  formatSubstituteMatchNotificationBody,
  matchesNotificationPreference,
  toJobMatchPreferenceInput,
  toSubstituteMatchPreferenceInput,
} from "@black-swan/domain";
import { shouldFanOutInbox } from "./notification-fanout.js";

test("shouldFanOutInbox requires created and fanOutInbox true", () => {
  assert.equal(shouldFanOutInbox({ created: true, fanOutInbox: true }), true);
  assert.equal(shouldFanOutInbox({ created: true, fanOutInbox: false }), false);
  assert.equal(shouldFanOutInbox({ created: true }), false);
  assert.equal(shouldFanOutInbox({ created: false, fanOutInbox: true }), false);
});

test("job match notification copy and preference input", () => {
  assert.equal(JOB_MATCH_NOTIFICATION_TITLE, "📢 관심 조건에 딱 맞는 공고가 올라왔어요");
  assert.equal(
    formatJobMatchNotificationBody({
      sigungu: "성북구",
      days: ["월", "수", "금"],
      timeSlots: ["evening"],
    }),
    "성북구 · 월수금 · 저녁",
  );

  const input = toJobMatchPreferenceInput({
    sido: "서울특별시",
    sigungu: "성북구",
    days: ["월", "수", "금"],
    dayGroups: [["월", "수", "금"]],
    timeSlots: ["evening"],
  });
  assert.equal(input.jobType, "regular");
  assert.deepEqual(input.days, ["월", "수", "금"]);
});

test("substitute match notification copy and preference input", () => {
  assert.equal(SUBSTITUTE_MATCH_NOTIFICATION_TITLE, "⚡ 관심 조건에 딱 맞는 대타가 올라왔어요");
  assert.equal(
    formatSubstituteMatchNotificationBody({
      sigungu: "성북구",
      lessonDates: ["2026-03-12"],
      timeSlots: ["evening"],
    }),
    "성북구 · 3/12(목) · 저녁",
  );

  const input = toSubstituteMatchPreferenceInput({
    sido: "서울특별시",
    sigungu: "성북구",
    lessonDates: ["2026-03-12"],
    timeSlots: ["evening"],
  });
  assert.equal(input.jobType, "substitute");
  assert.deepEqual(input.days, ["목"]);
});

test("matching filter rejects master off and region mismatch", () => {
  const preference = {
    enabled: true,
    rules: [
      {
        id: "1",
        enabled: true,
        jobType: "regular" as const,
        sido: "서울특별시",
        sigungu: "성북구",
        days: [] as string[],
        timeSlots: [] as Array<"morning" | "afternoon" | "evening">,
      },
    ],
  };

  assert.equal(
    matchesNotificationPreference(preference, {
      jobType: "regular",
      sido: "서울특별시",
      sigungu: "성북구",
      days: ["월"],
      timeSlots: ["morning"],
    }),
    true,
  );
  assert.equal(
    matchesNotificationPreference(
      { ...preference, enabled: false },
      {
        jobType: "regular",
        sido: "서울특별시",
        sigungu: "성북구",
        days: ["월"],
        timeSlots: ["morning"],
      },
    ),
    false,
  );
  assert.equal(
    matchesNotificationPreference(preference, {
      jobType: "regular",
      sido: "서울특별시",
      sigungu: "강남구",
      days: ["월"],
      timeSlots: ["morning"],
    }),
    false,
  );
});
