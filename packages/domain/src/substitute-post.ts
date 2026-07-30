import type { SourceName } from "./enums.js";

export type SubstitutePostStatus = "OPEN" | "EXPIRED" | "DELETED";
export type SubstituteUrgency = "same_day" | "next_day" | "normal";

export interface SubstituteTimeSlot {
  start: string | null;
  end: string | null;
  raw: string | null;
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
  author: string | null;
  postedAt: Date | null;
  lessonDates: string[];
  timeSlots: SubstituteTimeSlot[];
  audienceTypes: string[];
  subjectTypes: string[];
  locationText: string | null;
  sido: string | null;
  sigungu: string | null;
  dongOrStation: string | null;
  payText: string | null;
  urgency: SubstituteUrgency | null;
  status: SubstitutePostStatus;
  expiresAt: Date | null;
  recommendCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubstitutePostDetail extends SubstitutePostSummary {
  body: string | null;
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
