import assert from "node:assert/strict";
import test from "node:test";
import {
  pickMatchingBackfillRows,
  regionsFromPreference,
} from "./notification-inbox-backfill-select";
import type { NotificationPreference } from "@balink/domain";

const preference: NotificationPreference = {
  enabled: true,
  rules: [
    {
      id: "gangnam",
      enabled: true,
      jobType: "regular",
      sido: "서울특별시",
      sigungu: "강남구",
      days: [],
      timeSlots: [],
    },
    {
      id: "songpa",
      enabled: true,
      jobType: "regular",
      sido: "서울특별시",
      sigungu: "송파구",
      days: [],
      timeSlots: [],
    },
    {
      id: "gangdong",
      enabled: true,
      jobType: "regular",
      sido: "서울특별시",
      sigungu: "강동구",
      days: [],
      timeSlots: [],
    },
  ],
};

test("regionsFromPreference keeps unique enabled regular districts", () => {
  assert.deepEqual(regionsFromPreference(preference, "regular"), [
    { sido: "서울특별시", sigungu: "강남구" },
    { sido: "서울특별시", sigungu: "송파구" },
    { sido: "서울특별시", sigungu: "강동구" },
  ]);
  assert.deepEqual(regionsFromPreference(preference, "substitute"), []);
});

test("pickMatchingBackfillRows keeps only the newest matching post", () => {
  const rows = pickMatchingBackfillRows(
    "user-1",
    preference,
    [
      {
        id: "job-guro",
        sido: "서울특별시",
        sigungu: "구로구",
        days: ["월"],
        timeSlots: ["evening"],
        createdAt: new Date("2026-08-18T12:00:00.000Z"),
      },
      {
        id: "job-gangnam",
        sido: "서울특별시",
        sigungu: "강남구",
        days: ["수", "금"],
        timeSlots: ["evening"],
        createdAt: new Date("2026-08-18T16:00:00.000Z"),
      },
      {
        id: "job-songpa",
        sido: "서울특별시",
        sigungu: "송파구",
        days: [],
        timeSlots: [],
        createdAt: new Date("2026-08-17T10:00:00.000Z"),
      },
    ],
    [
      {
        id: "sub-gangnam",
        sido: "서울특별시",
        sigungu: "강남구",
        lessonDatesJson: ["2026-08-20"],
        timeSlotsJson: ["morning"],
        createdAt: new Date("2026-08-18T18:00:00.000Z"),
      },
    ],
  );

  assert.deepEqual(
    rows.map((row) => row.jobPostId ?? row.substitutePostId),
    ["job-gangnam"],
  );
  assert.equal(rows[0]?.href, "/jobs/job-gangnam");
  assert.equal(rows[0]?.type, "job_match");
});

test("pickMatchingBackfillRows skips when master toggle is off", () => {
  const rows = pickMatchingBackfillRows(
    "user-1",
    { ...preference, enabled: false },
    [
      {
        id: "job-gangnam",
        sido: "서울특별시",
        sigungu: "강남구",
        days: [],
        timeSlots: [],
        createdAt: new Date("2026-08-18T16:00:00.000Z"),
      },
    ],
    [],
  );
  assert.equal(rows.length, 0);
});
