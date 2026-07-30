import assert from "node:assert/strict";
import test from "node:test";
import { extractLocationHints, validateAdminDistrict } from "@black-swan/domain";
import { geocodeLocation } from "./location-geocoder.js";

test("validateAdminDistrict accepts known Seoul districts", () => {
  const validated = validateAdminDistrict("서울", "강남구");
  assert.equal(validated.valid, true);
  assert.equal(validated.sido, "서울특별시");
  assert.equal(validated.sigungu, "강남구");
});

test("extractLocationHints prefers explicit address in title", () => {
  const hints = extractLocationHints("서울 강남구 발레 강사", "");
  assert.equal(hints.length > 0, true);
  assert.equal(hints[0]?.sido, "서울특별시");
  assert.equal(hints[0]?.sigungu, "강남구");
});

test("geocodeLocation prefers validated LLM location", async () => {
  const location = await geocodeLocation({
    title: "서울 영등포 / 화.오전 성인발레 강사님 구인합니다",
    description: "서울 영등포구 선유도역 3분 거리",
    company: "영등포블랑발레",
    locationText: "서울 영등포구 선유도역 3분 거리",
    parsedSido: "서울특별시",
    parsedSigungu: "영등포구",
    parsedDongOrStation: "선유도역",
    parsedConfidence: "high",
  });

  assert.equal(location.source, "llm");
  assert.equal(location.locationText, "서울 영등포구 선유도역");
  assert.equal(location.sido, "서울특별시");
  assert.equal(location.sigungu, "영등포구");
  assert.equal(location.dongOrStation, "선유도역");
});
