import type { DisplaySection, NormalizedLocation, RepresentativePay } from "@balink/domain";
import { defaultRepresentativePay } from "@balink/domain";
import OpenAI from "openai";
import { geocodeLocation } from "./location-geocoder.js";
import type { ListingEnrichment } from "@balink/domain";
import {
  buildRepresentativePayJsonSchema,
  normalizeRepresentativePayFromSources,
  REPRESENTATIVE_PAY_LLM_RULES,
} from "./representative-pay-llm.js";
import {
  buildLocationJsonSchema,
  LOCATION_LLM_RULES,
  resolveLocationTextForGeocode,
} from "./location-llm.js";

const llmModel = process.env.OPENAI_MODEL || "gpt-5.4";

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
  const representativePay = normalizeRepresentativePayFromSources(
    llmResult.representativePay,
    title,
    description,
    stringValue(input.raw.summaryPayText),
  );

  const normalizedLocation = await geocodeLocation({
    title,
    description,
    company,
    locationText: resolveLocationTextForGeocode({
      llmEvidence: llmResult.location.evidence,
      listingSummaryRegion: stringValue(input.raw.summaryRegionText),
      title,
      description,
    }),
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
          REPRESENTATIVE_PAY_LLM_RULES,
          LOCATION_LLM_RULES,
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
      representativePay: buildRepresentativePayJsonSchema(),
      location: buildLocationJsonSchema(),
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
