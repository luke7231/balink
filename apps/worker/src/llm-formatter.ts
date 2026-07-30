import type { DisplaySection, NormalizedLocation, RepresentativePay } from "@black-swan/domain";
import { defaultRepresentativePay, finalizeRepresentativePay } from "@black-swan/domain";
import OpenAI from "openai";
import { geocodeLocation } from "./location-geocoder.js";
import type { ListingEnrichment } from "@black-swan/domain";

const llmModel = process.env.OPENAI_MODEL || "gpt-5.5";

export interface FormatListingInput {
  raw: Record<string, unknown>;
}

type LlmLocation = Omit<NormalizedLocation, "source" | "locationText"> & {
  evidence: string | null;
};

export async function enrichListing(input: FormatListingInput): Promise<ListingEnrichment> {
  const title = stringValue(input.raw.title) || "";
  const description = stringValue(input.raw.detailText) || "";
  const company = stringValue(input.raw.company);

  const llmResult = await callFormatLlm(input.raw);
  const representativePay = finalizeRepresentativePay(llmResult.representativePay);

  const normalizedLocation = await geocodeLocation({
    title,
    description,
    company,
    locationText: llmResult.location.evidence ?? stringValue(input.raw.summaryRegionText),
    parsedSido: llmResult.location.sido,
    parsedSigungu: llmResult.location.sigungu,
    parsedDongOrStation: llmResult.location.dongOrStation,
    parsedConfidence: llmResult.location.confidence,
  });

  return {
    displaySections: llmResult.displaySections,
    representativePay,
    location: normalizedLocation,
    meta: {
      formattedAt: new Date().toISOString(),
      formatModel: llmResult.model,
      geocodeAttempted: normalizedLocation.source === "kakao",
    },
  };
}

async function callFormatLlm(
  raw: Record<string, unknown>,
): Promise<{
  displaySections: DisplaySection[];
  representativePay: RepresentativePay;
  location: LlmLocation;
  model: string | null;
}> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      displaySections: buildFallbackSections(raw),
      representativePay: defaultRepresentativePay(),
      location: defaultLlmLocation(),
      model: null,
    };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.responses.create({
    model: llmModel,
    input: [
      {
        role: "system",
        content: [
          "너는 발레 강사 채용공고 원문을 읽고, 표시용 섹션·대표 급여·근무 지역을 직접 파악하는 편집기다.",
          "입력은 크롤링한 원문 텍스트뿐이다. 별도 분류·파싱 결과는 없다.",
          "원문을 수정하거나 새 사실을 만들지 말고, 읽은 내용만 구조화한다.",
          "원문 근거가 없는 값은 null/unspecified로 두고 confidence를 low로 표시한다.",
          "representativePay.evidence에는 급여 판단에 쓴 원문 구절을 그대로 적는다.",
          "급여 판단 규칙:",
          "- unit은 반드시 hourly(시간당), per_class(회당), daily(일당), weekly(주급), monthly(월급), lump_sum(총액/건당), variable(타임별 상이), negotiable(추후 협의), unspecified(미기재) 중 하나로 정한다.",
          "- '페이 9', '페이 8.5' 등은 대강·대체 1회 총액(만원 단위)이며 unit은 lump_sum이다.",
          "- '시간당 6만원', '회당 5만', '일당 9' 등 단위가 명시된 경우 해당 unit을 사용한다.",
          "- 날짜(7/29), 시각(7:30, 6시반), 면적(150평), 인원(8명) 숫자는 급여로 쓰지 않는다.",
          "- 목록 요약과 본문 급여가 다르면 본문·제목의 명시적 표현을 우선하고 hasConflict=true, alternateEvidence에 다른 표현을 적는다.",
          "지역 판단 규칙:",
          "- 제목과 본문 전체를 읽고 근무지의 시·도, 시·군·구, 동 또는 역을 파악한다.",
          "- 예: '서울 영등포구 선유도역 3분 거리'는 sido='서울특별시', sigungu='영등포구', dongOrStation='선유도역'이다.",
          "- 신도시명·동명·역명만 적혀 있어도 일반적인 지리 지식으로 소속 행정구역을 찾아 완성한다. 이는 새 사실 생성이 아니라 장소 해석이다.",
          "- 예: '다산신도시'는 sido='경기도', sigungu='남양주시', dongOrStation='다산동'이다.",
          "- 예: '인천 구월동'은 sido='인천광역시', sigungu='남동구', dongOrStation='구월동'이다.",
          "- 장소명으로 행정구역을 합리적으로 완성한 경우 confidence='medium', 원문에 행정구역이 직접 명시되면 confidence='high'로 둔다.",
          "- 학원명은 지역 필드에 넣지 않는다. evidence에는 지역 판단에 쓴 원문 구절을 그대로 적는다.",
          "- 장소명조차 없거나 어느 지역인지 특정할 수 없을 때만 각 필드를 null로 두고 confidence='low'로 표시한다.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify(buildOriginalTextPayload(raw), null, 2),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "formatted_job_post",
        strict: true,
        schema: formatSchema(),
      },
    },
  });

  const outputText = response.output_text || extractResponseText(response);
  if (!outputText) {
    throw new Error("OpenAI format response did not include output text.");
  }

  const parsed = JSON.parse(outputText) as {
    displaySections: DisplaySection[];
    representativePay: RepresentativePay;
    location: LlmLocation;
  };

  return {
    displaySections: parsed.displaySections.filter((section) => section.title && section.content),
    representativePay: parsed.representativePay,
    location: parsed.location,
    model: llmModel,
  };
}

function formatSchema() {
  const payUnitEnum = [
    "hourly",
    "per_class",
    "daily",
    "weekly",
    "monthly",
    "lump_sum",
    "variable",
    "negotiable",
    "unspecified",
  ];
  const confidenceEnum = ["high", "medium", "low"];

  return {
    type: "object",
    additionalProperties: false,
    required: ["displaySections", "representativePay", "location"],
    properties: {
      displaySections: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "content"],
          properties: {
            title: { type: "string" },
            content: { type: "string" },
          },
        },
      },
      representativePay: {
        type: "object",
        additionalProperties: false,
        required: [
          "unit",
          "displayText",
          "minManwon",
          "maxManwon",
          "evidence",
          "confidence",
          "hasConflict",
          "alternateEvidence",
        ],
        properties: {
          unit: { type: "string", enum: payUnitEnum },
          displayText: { type: "string" },
          minManwon: { type: ["number", "null"] },
          maxManwon: { type: ["number", "null"] },
          evidence: { type: ["string", "null"] },
          confidence: { type: "string", enum: confidenceEnum },
          hasConflict: { type: "boolean" },
          alternateEvidence: { type: ["string", "null"] },
        },
      },
      location: {
        type: "object",
        additionalProperties: false,
        required: ["sido", "sigungu", "dongOrStation", "evidence", "confidence"],
        properties: {
          sido: { type: ["string", "null"] },
          sigungu: { type: ["string", "null"] },
          dongOrStation: { type: ["string", "null"] },
          evidence: { type: ["string", "null"] },
          confidence: { type: "string", enum: confidenceEnum },
        },
      },
    },
  };
}

function buildOriginalTextPayload(raw: Record<string, unknown>) {
  return {
    originalText: {
      title: stringValue(raw.title),
      company: stringValue(raw.company),
      listingSummaryPay: stringValue(raw.summaryPayText),
      listingSummaryRegion: stringValue(raw.summaryRegionText),
      body: stringValue(raw.detailText),
    },
  };
}

function buildFallbackSections(raw: Record<string, unknown>): DisplaySection[] {
  const sections: DisplaySection[] = [];
  const company = stringValue(raw.company);
  const detailText = stringValue(raw.detailText);

  if (company) {
    sections.push({ title: "학원명", content: company });
  }
  if (detailText) {
    sections.push({ title: "공고 내용", content: detailText });
  }
  return sections;
}

function defaultLlmLocation(): LlmLocation {
  return {
    sido: null,
    sigungu: null,
    dongOrStation: null,
    evidence: null,
    confidence: "low",
  };
}

function extractResponseText(response: OpenAI.Responses.Response): string {
  const chunks: string[] = [];
  for (const item of response.output || []) {
    if (item.type !== "message") continue;
    for (const content of item.content || []) {
      if (content.type === "output_text" && "text" in content && content.text) {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("");
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
