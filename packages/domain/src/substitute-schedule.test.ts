import assert from "node:assert/strict";
import test from "node:test";
import { deriveSubstituteSchedule, deriveSubstituteStatus } from "./substitute-schedule.js";
import type { SubstituteRecurrence, SubstituteSession } from "./substitute-post.js";

const NOW = new Date("2026-07-30T10:00:00+09:00");

function session(partial: Partial<SubstituteSession>): SubstituteSession {
  return {
    date: null,
    day: null,
    startTime: null,
    endTime: null,
    durationMinutes: null,
    audienceTypes: [],
    subjectTypes: [],
    pay: null,
    evidence: null,
    confidence: "medium",
    origin: "explicit",
    ...partial,
  };
}

test("deriveSubstituteSchedule uses sorted max date for dated expiresAt", () => {
  const derived = deriveSubstituteSchedule({
    title: "대강",
    postedAt: NOW,
    sessions: [
      session({ date: "2026-08-11", startTime: "16:30", endTime: "17:10" }),
      session({ date: "2026-08-04", startTime: "16:30", endTime: "17:10" }),
    ],
    recurrence: null,
    now: NOW,
  });

  assert.equal(derived.scheduleKind, "dated");
  assert.equal(derived.expiresAt.toISOString(), new Date("2026-08-11T23:59:59+09:00").toISOString());
  assert.equal(derived.nextLessonAt?.toISOString(), new Date("2026-08-04T16:30:00+09:00").toISOString());
});

test("deriveSubstituteSchedule prevents permanent OPEN for unscheduled posts", () => {
  const derived = deriveSubstituteSchedule({
    title: "8월한달대강",
    postedAt: NOW,
    sessions: [],
    recurrence: null,
    now: NOW,
  });

  assert.equal(derived.scheduleKind, "unscheduled");
  assert.equal(derived.nextLessonAt, null);
  assert.equal(derived.expiresAt.toISOString(), new Date("2026-08-06T23:59:59+09:00").toISOString());
  assert.equal(derived.urgency, "normal");
});

test("deriveSubstituteSchedule expands recurring sessions with month end cap", () => {
  const recurrence: SubstituteRecurrence = {
    startDate: "2026-08-01",
    endDate: null,
    endDateInferred: false,
    daysOfWeek: ["화", "목"],
    startTime: "17:00",
    endTime: "17:50",
    durationMinutes: 50,
    audienceTypes: ["kids"],
    subjectTypes: ["ballet"],
    pay: null,
    evidence: "8월 한 달 화·목 5시~5시50분",
    confidence: "medium",
  };

  const derived = deriveSubstituteSchedule({
    title: "8월 대강",
    postedAt: NOW,
    sessions: [],
    recurrence,
    now: NOW,
  });

  assert.equal(derived.scheduleKind, "recurring");
  assert.ok(derived.sessions.length > 0);
  assert.equal(derived.recurrence?.endDate, "2026-08-31");
  assert.equal(derived.expiresAt.toISOString(), new Date("2026-08-31T23:59:59+09:00").toISOString());
});

test("deriveSubstituteStatus marks expired posts after expiresAt", () => {
  const status = deriveSubstituteStatus({
    expiresAt: new Date("2026-07-29T23:59:59+09:00"),
    now: NOW,
  });
  assert.equal(status, "EXPIRED");
});

test("deriveSubstituteSchedule dedupes duplicate sessions", () => {
  const derived = deriveSubstituteSchedule({
    title: "중복",
    postedAt: NOW,
    sessions: [
      session({ date: "2026-08-04", startTime: "16:30", endTime: "17:10", audienceTypes: ["adult"] }),
      session({ date: "2026-08-04", startTime: "16:30", endTime: "17:10", audienceTypes: ["adult"] }),
    ],
    recurrence: null,
    now: NOW,
  });

  assert.equal(derived.sessions.length, 1);
  assert.deepEqual(derived.timeSlots, [{ start: "16:30", end: "17:10", raw: "16:30~17:10" }]);
});
