import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatDayGroups,
  matchesPostDays,
  sanitizeSchedule,
  timeRangeToAlertSlots,
} from "./schedule.js";

test("sanitizeSchedule defaults 1-8h to PM; keeps 9-11 unless evening-only cues", () => {
  const schedule = sanitizeSchedule(
    {
      days: ["월", "수", "금", "화", "목", "토"],
      dayGroups: [
        ["월", "수", "금"],
        ["화", "목"],
        ["토"],
      ],
      times: [
        { start: "05:00", end: "05:50", raw: "5-5:50" },
        { start: "06:00", end: "07:30", raw: "6-7:30" },
        { start: "08:40", end: "09:40", raw: "8:40-9:40" },
        { start: "10:00", end: "10:50", raw: "오전10-10:50" },
      ],
      timeSlots: ["morning"],
    },
    {
      title: "서대문구월수금/화목/토 발레선생님구합니다.",
      detailText: "월수금\n5-5:50\n토\n오전10-10:50 유아",
    },
  );

  assert.deepEqual(schedule.dayGroups, [
    ["월", "수", "금"],
    ["화", "목"],
    ["토"],
  ]);
  assert.equal(schedule.times[0]?.start, "17:00");
  assert.equal(schedule.times[1]?.start, "18:00");
  assert.equal(schedule.times[2]?.start, "20:40");
  assert.equal(schedule.times[3]?.start, "10:00");
  assert.ok(schedule.timeSlots.includes("evening"));
  assert.ok(schedule.timeSlots.includes("morning"));
  assert.ok(!schedule.timeSlots.includes("unknown"));
});

test("evening 4:30-5:30 spans afternoon and evening", () => {
  assert.deepEqual(timeRangeToAlertSlots("16:30", "17:30"), ["afternoon", "evening"]);
});

test("formatDayGroups and matchesPostDays", () => {
  assert.equal(
    formatDayGroups(
      [
        ["수", "금"],
        ["월", "수"],
        ["화", "목"],
      ],
      [],
    ),
    "수·금 / 월·수 / 화·목",
  );

  assert.equal(
    matchesPostDays(
      ["월", "수"],
      {
        dayGroups: [
          ["수", "금"],
          ["월", "수"],
          ["화", "목"],
        ],
      },
      "and",
    ),
    true,
  );
  assert.equal(
    matchesPostDays(
      ["월", "수", "금"],
      {
        dayGroups: [
          ["수", "금"],
          ["월", "수"],
          ["화", "목"],
        ],
      },
      "and",
    ),
    false,
  );
});

test("dayGroups merge when class days listed separately but one position", () => {
  const schedule = sanitizeSchedule(
    {
      days: ["월", "수", "목"],
      dayGroups: [
        ["월", "수"],
        ["목"],
      ],
      times: [
        { start: "19:00", end: "19:50", raw: "월 수 19:00" },
        { start: "19:30", end: "20:50", raw: "목 19:30" },
      ],
      timeSlots: ["evening"],
    },
    {
      title: "월 수 목 저녁 성인 발레 클래스 가능하신 선생님 모십니다.",
      detailText: "월 수 19:00\n목 19:30 (80분)\n목 21:00 작품 클래스",
    },
  );
  assert.deepEqual(schedule.dayGroups, [["월", "수", "목"]]);
});

test("한요일만 지원가능 splits into singleton day groups", () => {
  const schedule = sanitizeSchedule(
    {
      days: ["화", "목"],
      dayGroups: [["화", "목"]],
      times: [
        { start: "19:00", end: "20:00", raw: "화요일 7시" },
        { start: "19:00", end: "20:00", raw: "목요일 7시" },
      ],
      timeSlots: ["evening"],
    },
    {
      title: "9월 시작 화목 신규강사모집",
      detailText: "화요일 7시 - 성인기초반\n목요일 7시 - 성인기초반\n(한요일만 지원가능)",
    },
  );
  assert.deepEqual(schedule.dayGroups, [["화"], ["목"]]);
});

test("keeps alternative dayGroups for or/선택 cues", () => {
  const withOr = sanitizeSchedule(
    {
      dayGroups: [
        ["수", "금"],
        ["화", "목"],
      ],
    },
    {
      title: "[용인시] 수,금 오전or화,목 오후 함께하실 강사님",
      detailText: "",
    },
  );
  assert.deepEqual(withOr.dayGroups, [
    ["수", "금"],
    ["화", "목"],
  ]);

  const withChoice = sanitizeSchedule(
    {
      dayGroups: [
        ["월", "수"],
        ["화", "목"],
      ],
    },
    {
      title: "대구발레강사님구함",
      detailText: "요일은 월수,화목 선택",
    },
  );
  assert.deepEqual(withChoice.dayGroups, [
    ["월", "수"],
    ["화", "목"],
  ]);
});

test("evening-only post without 오전 words", () => {
  const schedule = sanitizeSchedule(
    {
      times: [
        { start: "07:00", end: "08:20", raw: "7:00~8:20" },
        { start: "08:30", end: "09:50", raw: "8:30~9:50" },
      ],
      timeSlots: ["morning", "evening"],
    },
    {
      title: "서울 노원구 화요일 저녁 2타임 대강",
      detailText: "8월 11일 화요일 저녁 7:00~8:20 / 8:30~9:50",
    },
  );
  assert.equal(schedule.times[0]?.start, "19:00");
  assert.deepEqual(
    schedule.timeSlots.filter((slot) => slot === "morning" || slot === "evening"),
    ["evening"],
  );
});
