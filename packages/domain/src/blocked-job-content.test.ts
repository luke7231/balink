import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BLOCKED_JOB_DROP_REASON,
  evaluateBlockedJobContent,
  isBlockedJobContent,
} from "./blocked-job-content.js";

test("blocks escort listings from reported cases", () => {
  const case1 = isBlockedJobContent({
    title: "월 최대 5천까지 접대 아르바이트 하실 203040 여성분",
    company: "스폰에이전시1",
    detailText: "라인 메신저 설치 가입 후 아이디 spag444 추가해서 문의주세요",
  });
  assert.equal(case1.blocked, true);
  assert.equal(case1.matched, "접대");
  assert.equal(case1.reason, BLOCKED_JOB_DROP_REASON);

  const case2 = isBlockedJobContent({
    title: "월 최대 5,000만까지 지원, 203040대 무용강사 원장님 찾습니다",
    company: null,
    detailText: "업무는 남성분 접대일이에요. 라인 메신저 아이디 spag444",
  });
  assert.equal(case2.blocked, true);
  assert.equal(case2.matched, "접대");

  const case3 = isBlockedJobContent({
    title: "월 최대 5,000만까지 지원, 203040대 무용강사 원장님 찾습니다",
    company: "스폰에이전시",
    description: "금전 문제 혼자 끙끙 앓지마세요. 업무는 남성분 접대일이에요.",
  });
  assert.equal(case3.blocked, true);
});

test("blocks other adult entertainment keywords", () => {
  assert.equal(evaluateBlockedJobContent("유흥업소 스태프 구인").blocked, true);
  assert.equal(evaluateBlockedJobContent("강남 룸살롱 매니저").matched, "룸살롱");
  assert.equal(evaluateBlockedJobContent("단란주점 알바").matched, "단란주점");
  assert.equal(evaluateBlockedJobContent("조건만남 가능하신 분").matched, "조건만남");
  assert.equal(evaluateBlockedJobContent("원나잇 가능한 분").matched, "원나잇");
  assert.equal(evaluateBlockedJobContent("텐프로 알바").matched, "텐프로");
  assert.equal(evaluateBlockedJobContent("쩜오 알바").matched, "쩜오");
  assert.equal(evaluateBlockedJobContent("스폰 에이전시 모집").matched, "스폰에이전시");
});

test("blocks 203040 + 여성 combo without 접대", () => {
  const result = evaluateBlockedJobContent("203040 여성분 구합니다 월 5천");
  assert.equal(result.blocked, true);
  assert.equal(result.matched, "203040+여성");
});

test("does not block normal ballet listings", () => {
  assert.equal(
    isBlockedJobContent({
      title: "(강남) 성인취미발레 평일 저녁",
      company: "리클래시 발레 스튜디오",
      detailText: "성인 취미반 발레 강사 모집합니다. 여성 강사 우대.",
    }).blocked,
    false,
  );
  assert.equal(
    evaluateBlockedJobContent("초등 발레 여성 강사 구합니다").blocked,
    false,
  );
  assert.equal(evaluateBlockedJobContent("성인반 바레 수업").blocked, false);
  assert.equal(evaluateBlockedJobContent("").blocked, false);
  assert.equal(evaluateBlockedJobContent(null).blocked, false);
});
