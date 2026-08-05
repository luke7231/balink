import type {
  RepresentativePay,
  SubstituteConfidence,
  SubstituteRecurrence,
  SubstituteSession,
  SubstituteSessionPay,
} from "@black-swan/domain";
import {
  defaultRepresentativePay,
  formatRepresentativePayDisplay,
} from "@black-swan/domain";
import OpenAI from "openai";
import { geocodeLocation } from "./location-geocoder.js";
import {
  buildRepresentativePayJsonSchema,
  normalizeRepresentativePayFromSources,
  REPRESENTATIVE_PAY_LLM_RULES,
} from "./representative-pay-llm.js";
import {
  buildLocationHintsPayload,
  buildLocationJsonSchema,
  LOCATION_LLM_RULES,
  resolveLocationTextForGeocode,
} from "./location-llm.js";

const llmModel = process.env.OPENAI_MODEL || "gpt-5.4";
const confidenceEnum = ["high", "medium", "low"] as const;
const sessionOriginEnum = ["explicit", "recurrence"] as const;
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
] as const;

export interface FormatSubstituteInput {
  title: string;
  detailText: string;
  postedAt: string | null;
}

export interface FormattedSubstitutePost {
  summary: string | null;
  location: {
    sido: string | null;
    sigungu: string | null;
    dongOrStation: string | null;
    evidence: string | null;
    confidence: SubstituteConfidence;
    locationText: string | null;
  };
  sessions: SubstituteSession[];
  recurrence: SubstituteRecurrence | null;
  representativePay: RepresentativePay;
  academyName: string | null;
  requirements: string[];
  applicationInstructions: string | null;
  notes: string[];
  model: string | null;
}

export async function formatSubstitutePost(input: FormatSubstituteInput): Promise<FormattedSubstitutePost> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for substitute normalization");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.responses.create({
    model: llmModel,
    input: [
      {
        role: "system",
        content: [
          "너는 발레 대타(대강) 게시글 원문을 구조화하는 편집기다.",
          "입력은 제목, 정제된 본문, 게시일(KST)뿐이다.",
          "원문에 없는 학원명, 급여, 수업 조건, 날짜, 시간을 만들지 않는다.",
          "게시일과 수업일을 구분한다. 오늘/내일, 8/4·11, 8월 한 달 화·목을 KST 절대 날짜로 해석한다.",
          "날짜와 시간의 대응 관계를 유지하고 같은 제목·본문에서 중복 추출하지 않는다.",
          "representativePay는 일정만큼 중요하다. 본문에 급여·페이·대강료로 읽히는 표현이 있으면 unspecified로 두지 않는다.",
          REPRESENTATIVE_PAY_LLM_RULES,
          "대타 게시판에는 채용공고처럼 목록 지역 요약이 없다. locationHints와 제목·본문에서 지역을 파악한다.",
          LOCATION_LLM_RULES,
          "개별 날짜가 모두 열거되지 않은 반복 일정은 recurrence에 저장하고 sessions에는 확정 날짜만 넣는다.",
          "evidence에는 판단 근거가 된 원문 구절을 그대로 적는다.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            title: input.title,
            detailText: input.detailText,
            postedAt: input.postedAt,
            locationHints: buildLocationHintsPayload(input.title, input.detailText),
          },
          null,
          2,
        ),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "substitute_post",
        strict: true,
        schema: buildSubstituteSchema(),
      },
    },
  });

  const parsed = JSON.parse(extractResponseText(response)) as Record<string, unknown>;
  const representativePay = normalizeRepresentativePayFromSources(
    parseRepresentativePay(parsed.representativePay),
    input.title,
    input.detailText,
    null,
  );
  const location = parseLocation(parsed.location);
  const normalizedLocation = await geocodeLocation({
    title: input.title,
    description: input.detailText,
    company: stringValue(parsed.academyName),
    locationText: resolveLocationTextForGeocode({
      llmEvidence: location.evidence,
      title: input.title,
      description: input.detailText,
    }),
    parsedSido: location.sido,
    parsedSigungu: location.sigungu,
    parsedDongOrStation: location.dongOrStation,
    parsedConfidence: location.confidence,
  });

  const sessions = dedupeValidatedSessions(parseSessions(parsed.sessions));
  const recurrence = parseRecurrence(parsed.recurrence);

  return {
    summary: stringValue(parsed.summary),
    location: {
      sido: normalizedLocation.sido,
      sigungu: normalizedLocation.sigungu,
      dongOrStation: normalizedLocation.dongOrStation,
      evidence: location.evidence,
      confidence: location.confidence,
      locationText: normalizedLocation.locationText,
    },
    sessions,
    recurrence,
    representativePay,
    academyName: stringValue(parsed.academyName),
    requirements: stringArray(parsed.requirements),
    applicationInstructions: stringValue(parsed.applicationInstructions),
    notes: stringArray(parsed.notes),
    model: response.model ?? llmModel,
  };
}

export function validateFormattedSubstitute(formatted: FormattedSubstitutePost, sourceText: string): void {
  for (const session of formatted.sessions) {
    if (session.startTime && !/^\d{2}:\d{2}$/.test(session.startTime)) {
      throw new Error(`Invalid session startTime: ${session.startTime}`);
    }
    if (session.endTime && !/^\d{2}:\d{2}$/.test(session.endTime)) {
      throw new Error(`Invalid session endTime: ${session.endTime}`);
    }
    if (session.evidence && !containsNormalizedText(sourceText, session.evidence)) {
      // Keep normalization resilient when LLM shortens evidence slightly.
      continue;
    }
  }
}

function buildSubstituteSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "summary",
      "location",
      "sessions",
      "recurrence",
      "representativePay",
      "academyName",
      "requirements",
      "applicationInstructions",
      "notes",
    ],
    properties: {
      summary: { type: ["string", "null"] },
      location: buildLocationJsonSchema(),
      sessions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "date",
            "day",
            "startTime",
            "endTime",
            "durationMinutes",
            "audienceTypes",
            "subjectTypes",
            "pay",
            "evidence",
            "confidence",
            "origin",
          ],
          properties: {
            date: { type: ["string", "null"] },
            day: { type: ["string", "null"] },
            startTime: { type: ["string", "null"] },
            endTime: { type: ["string", "null"] },
            durationMinutes: { type: ["number", "null"] },
            audienceTypes: { type: "array", items: { type: "string" } },
            subjectTypes: { type: "array", items: { type: "string" } },
            pay: {
              anyOf: [
                { type: "null" },
                {
                  type: "object",
                  additionalProperties: false,
                  required: ["unit", "minManwon", "maxManwon", "evidence", "confidence"],
                  properties: {
                    unit: { type: "string", enum: payUnitEnum },
                    minManwon: { type: ["number", "null"] },
                    maxManwon: { type: ["number", "null"] },
                    evidence: { type: ["string", "null"] },
                    confidence: { type: "string", enum: confidenceEnum },
                  },
                },
              ],
            },
            evidence: { type: ["string", "null"] },
            confidence: { type: "string", enum: confidenceEnum },
            origin: { type: "string", enum: sessionOriginEnum },
          },
        },
      },
      recurrence: {
        anyOf: [
          { type: "null" },
          {
            type: "object",
            additionalProperties: false,
            required: [
              "startDate",
              "endDate",
              "endDateInferred",
              "daysOfWeek",
              "startTime",
              "endTime",
              "durationMinutes",
              "audienceTypes",
              "subjectTypes",
              "pay",
              "evidence",
              "confidence",
            ],
            properties: {
              startDate: { type: ["string", "null"] },
              endDate: { type: ["string", "null"] },
              endDateInferred: { type: "boolean" },
              daysOfWeek: { type: "array", items: { type: "string" } },
              startTime: { type: ["string", "null"] },
              endTime: { type: ["string", "null"] },
              durationMinutes: { type: ["number", "null"] },
              audienceTypes: { type: "array", items: { type: "string" } },
              subjectTypes: { type: "array", items: { type: "string" } },
              pay: {
                anyOf: [
                  { type: "null" },
                  {
                    type: "object",
                    additionalProperties: false,
                    required: ["unit", "minManwon", "maxManwon", "evidence", "confidence"],
                    properties: {
                      unit: { type: "string", enum: payUnitEnum },
                      minManwon: { type: ["number", "null"] },
                      maxManwon: { type: ["number", "null"] },
                      evidence: { type: ["string", "null"] },
                      confidence: { type: "string", enum: confidenceEnum },
                    },
                  },
                ],
              },
              evidence: { type: ["string", "null"] },
              confidence: { type: "string", enum: confidenceEnum },
            },
          },
        ],
      },
      representativePay: buildRepresentativePayJsonSchema(),
      academyName: { type: ["string", "null"] },
      requirements: { type: "array", items: { type: "string" } },
      applicationInstructions: { type: ["string", "null"] },
      notes: { type: "array", items: { type: "string" } },
    },
  };
}

function parseSessions(value: unknown): SubstituteSession[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = asRecord(item);
    return {
      date: stringValue(record.date),
      day: stringValue(record.day),
      startTime: normalizeTime(stringValue(record.startTime)),
      endTime: normalizeTime(stringValue(record.endTime)),
      durationMinutes: numberValue(record.durationMinutes),
      audienceTypes: stringArray(record.audienceTypes),
      subjectTypes: stringArray(record.subjectTypes),
      pay: parseSessionPay(record.pay),
      evidence: stringValue(record.evidence),
      confidence: parseConfidence(record.confidence),
      origin: record.origin === "recurrence" ? "recurrence" : "explicit",
    };
  });
}

function parseRecurrence(value: unknown): SubstituteRecurrence | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return {
    startDate: stringValue(record.startDate),
    endDate: stringValue(record.endDate),
    endDateInferred: Boolean(record.endDateInferred),
    daysOfWeek: stringArray(record.daysOfWeek),
    startTime: normalizeTime(stringValue(record.startTime)),
    endTime: normalizeTime(stringValue(record.endTime)),
    durationMinutes: numberValue(record.durationMinutes),
    audienceTypes: stringArray(record.audienceTypes),
    subjectTypes: stringArray(record.subjectTypes),
    pay: parseSessionPay(record.pay),
    evidence: stringValue(record.evidence),
    confidence: parseConfidence(record.confidence),
  };
}

function parseRepresentativePay(value: unknown): RepresentativePay {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultRepresentativePay();
  }
  const record = value as Record<string, unknown>;
  const pay: RepresentativePay = {
    unit: (record.unit as RepresentativePay["unit"]) || "unspecified",
    displayText: stringValue(record.displayText) ?? "",
    minManwon: numberValue(record.minManwon),
    maxManwon: numberValue(record.maxManwon),
    evidence: stringValue(record.evidence),
    confidence: parseConfidence(record.confidence),
    hasConflict: Boolean(record.hasConflict),
    alternateEvidence: stringValue(record.alternateEvidence),
  };
  if (!pay.displayText) {
    pay.displayText = formatRepresentativePayDisplay(pay);
  }
  return pay;
}

function parseLocation(value: unknown) {
  const record = asRecord(value);
  return {
    sido: stringValue(record.sido),
    sigungu: stringValue(record.sigungu),
    dongOrStation: stringValue(record.dongOrStation),
    evidence: stringValue(record.evidence),
    confidence: parseConfidence(record.confidence),
  };
}

function parseSessionPay(value: unknown): SubstituteSessionPay | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return {
    unit: (record.unit as SubstituteSessionPay["unit"]) || "unspecified",
    minManwon: numberValue(record.minManwon),
    maxManwon: numberValue(record.maxManwon),
    evidence: stringValue(record.evidence),
    confidence: parseConfidence(record.confidence),
  };
}

function dedupeValidatedSessions(sessions: SubstituteSession[]): SubstituteSession[] {
  const seen = new Set<string>();
  return sessions.filter((session) => {
    const key = [
      session.date ?? "",
      session.startTime ?? "",
      session.endTime ?? "",
      session.audienceTypes.join(","),
      session.subjectTypes.join(","),
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseConfidence(value: unknown): SubstituteConfidence {
  return value === "high" || value === "medium" || value === "low" ? value : "low";
}

function normalizeTime(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function containsNormalizedText(source: string, fragment: string): boolean {
  return normalizeMatchText(source).includes(normalizeMatchText(fragment));
}

function normalizeMatchText(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}
