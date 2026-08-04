import type { SourceName } from "./enums.js";
import type { RepresentativePay } from "./formatted-post.js";

export const SUBSTITUTE_NORMALIZATION_VERSION = 1;

export type SubstitutePostStatus = "OPEN" | "EXPIRED" | "DELETED";
export type SubstituteUrgency = "same_day" | "next_day" | "normal";
export type SubstituteScheduleKind = "dated" | "recurring" | "unscheduled";
export type SubstituteSessionOrigin = "explicit" | "recurrence";
export type SubstituteConfidence = "high" | "medium" | "low";

export interface SubstituteTimeSlot {
  start: string | null;
  end: string | null;
  raw: string | null;
}

export interface SubstituteSessionPay {
  unit: RepresentativePay["unit"];
  minManwon: number | null;
  maxManwon: number | null;
  evidence: string | null;
  confidence: SubstituteConfidence;
}

export interface SubstituteSession {
  date: string | null;
  day: string | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  audienceTypes: string[];
  subjectTypes: string[];
  pay: SubstituteSessionPay | null;
  evidence: string | null;
  confidence: SubstituteConfidence;
  origin: SubstituteSessionOrigin;
}

export interface SubstituteRecurrence {
  startDate: string | null;
  endDate: string | null;
  endDateInferred: boolean;
  daysOfWeek: string[];
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  audienceTypes: string[];
  subjectTypes: string[];
  pay: SubstituteSessionPay | null;
  evidence: string | null;
  confidence: SubstituteConfidence;
}

export interface SubstitutePostFilterInput {
  status?: SubstitutePostStatus | null;
  sido?: string | null;
  sigungu?: string | null;
  source?: SourceName | null;
}

export interface SubstitutePostSummary {
  id: string;
  source: SourceName;
  sourceUrl: string;
  title: string;
  summary: string | null;
  author: string | null;
  postedAt: Date | null;
  scheduleKind: SubstituteScheduleKind;
  sessions: SubstituteSession[];
  recurrence: SubstituteRecurrence | null;
  lessonDates: string[];
  timeSlots: SubstituteTimeSlot[];
  audienceTypes: string[];
  subjectTypes: string[];
  locationText: string | null;
  sido: string | null;
  sigungu: string | null;
  dongOrStation: string | null;
  payText: string | null;
  representativePayText: string | null;
  academyName: string | null;
  urgency: SubstituteUrgency | null;
  status: SubstitutePostStatus;
  nextLessonAt: Date | null;
  expiresAt: Date | null;
  recommendCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubstitutePostDetail extends SubstitutePostSummary {
  body: string | null;
  requirements: string[];
  applicationInstructions: string | null;
  notes: string[];
  representativePay: RepresentativePay | null;
  contactMethods: string[];
  contactEmails: string[];
  contactPhones: string[];
  classification: unknown;
}

export interface SubstituteImportInput {
  source: SourceName;
  sourcePostId: string;
  sourceUrl: string;
  collectedAt: string;
  raw: Record<string, unknown>;
  classification: Record<string, unknown>;
}

export interface DeriveSubstituteScheduleInput {
  title: string;
  postedAt: Date | null;
  sessions: SubstituteSession[];
  recurrence: SubstituteRecurrence | null;
  now?: Date;
}

export interface DerivedSubstituteSchedule {
  scheduleKind: SubstituteScheduleKind;
  sessions: SubstituteSession[];
  recurrence: SubstituteRecurrence | null;
  nextLessonAt: Date | null;
  expiresAt: Date;
  urgency: SubstituteUrgency;
  lessonDates: string[];
  timeSlots: SubstituteTimeSlot[];
  audienceTypes: string[];
  subjectTypes: string[];
}

export interface DeriveSubstituteStatusInput {
  deleted?: boolean;
  expiresAt: Date | null;
  now?: Date;
}
