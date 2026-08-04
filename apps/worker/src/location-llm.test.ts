import assert from "node:assert/strict";
import test from "node:test";
import { resolveLocationTextForGeocode } from "./location-llm.js";

test("resolveLocationTextForGeocode prefers LLM evidence", () => {
  const resolved = resolveLocationTextForGeocode({
    llmEvidence: "용인시 수지구 죽전",
    listingSummaryRegion: "경기 전지역",
    title: "용인 죽전 대강",
    description: "▶ 지역 : 용인시 수지구 죽전",
  });
  assert.equal(resolved, "용인시 수지구 죽전");
});

test("resolveLocationTextForGeocode uses listing summary region for jobs", () => {
  const resolved = resolveLocationTextForGeocode({
    llmEvidence: null,
    listingSummaryRegion: "경기 김포시",
    title: "김포 대강",
    description: "연락 주세요",
  });
  assert.equal(resolved, "경기 김포시");
});

test("resolveLocationTextForGeocode falls back to title and body hints for substitutes", () => {
  const resolved = resolveLocationTextForGeocode({
    llmEvidence: null,
    title: "용인 죽전 8/6(목) 발레 대강",
    description: "▶ 지역 : 용인시 수지구 죽전",
  });
  assert.equal(resolved, "경기도 용인시 수지구 죽전");
});
