import { JOB_TYPE_LABELS, TIME_SLOT_LABELS } from "./enums.js";
import { formatAudienceType, formatSubjectType } from "./format.js";
import { displayableTimeSlots } from "./schedule.js";
import type { JobPostDetail, JobPostSummary } from "./job-post.js";
import type {
  SubstitutePostDetail,
  SubstitutePostSummary,
  SubstituteSession,
} from "./substitute-post.js";
import type { RepresentativePay } from "./formatted-post.js";

const BALLETMANIA = "balletmania";

export function isBalletmaniaSource(source: string | null | undefined): boolean {
  return source === BALLETMANIA;
}

/** 목록/상세 제목용 짧은 요약 (원문 title 대체) */
export function buildPublicTitleSummary(input: {
  sigungu?: string | null;
  dongOrStation?: string | null;
  jobType?: string | null;
  audienceTypes?: string[] | null;
  subjectTypes?: string[] | null;
  timeSlots?: string[] | null;
}): string {
  const parts: string[] = [];
  const place = trimText(input.dongOrStation) || trimText(input.sigungu);
  if (place) parts.push(place);

  const audience = formatAudienceType(firstLabel(input.audienceTypes));
  if (audience) parts.push(audience);

  for (const subject of publicSubjectLabels(input.subjectTypes, audience)) {
    parts.push(subject);
  }

  if (input.jobType) {
    parts.push(JOB_TYPE_LABELS[input.jobType] ?? input.jobType);
  }

  for (const slot of displayableTimeSlots(input.timeSlots ?? [])) {
    parts.push(TIME_SLOT_LABELS[slot] ?? slot);
  }

  return parts.length > 0 ? parts.join(" · ") : "발레 채용 공고";
}

/**
 * 급여 요약. 원문 payText / evidence 문장은 쓰지 않고
 * 구조화 숫자·협의 여부만으로 짧은 라벨을 만든다.
 */
export function buildPublicPaySummary(input: {
  payMinManwon?: number | null;
  payMaxManwon?: number | null;
  payNegotiable?: boolean | null;
  hasPaySignal?: boolean;
}): string {
  const min = input.payMinManwon;
  const max = input.payMaxManwon;
  if (min != null && max != null) {
    if (min === max) return `${formatManwon(min)}만원대`;
    return `${formatManwon(min)}~${formatManwon(max)}만원대`;
  }
  if (min != null) return `${formatManwon(min)}만원대~`;
  if (max != null) return `~${formatManwon(max)}만원대`;
  if (input.payNegotiable) return "협의";
  if (input.hasPaySignal) return "급여 정보 있음";
  return "협의";
}

export function redactBalletmaniaJobSummary(job: JobPostSummary): JobPostSummary {
  if (!isBalletmaniaSource(job.sourcePrimary)) return job;

  const paySummary = buildPublicPaySummary({
    payMinManwon: job.payMinManwon,
    payMaxManwon: job.payMaxManwon,
    payNegotiable: job.payNegotiable,
    hasPaySignal: Boolean(job.payText || job.representativePayText),
  });

  return {
    ...job,
    title: buildPublicTitleSummary(job),
    // locationText / sido / sigungu / dongOrStation 유지
    payText: null,
    representativePayText: paySummary,
  };
}

export function redactBalletmaniaJobDetail(job: JobPostDetail): JobPostDetail {
  if (!isBalletmaniaSource(job.sourcePrimary)) return job;

  const summary = redactBalletmaniaJobSummary(job);

  return {
    ...job,
    ...summary,
    description: null,
    displaySections: [],
    contactMethods: [],
    contactEmails: [],
    contactPhones: [],
    requirements: null,
    confidence: null,
    representativePay: redactRepresentativePay(job.representativePay, summary.representativePayText),
  };
}

export function redactBalletmaniaSubstituteSummary(
  post: SubstitutePostSummary,
): SubstitutePostSummary {
  if (!isBalletmaniaSource(post.source)) return post;

  const fromSessions = paySummaryFromSessions(post.sessions);
  const paySummary =
    fromSessions ??
    buildPublicPaySummary({
      hasPaySignal: Boolean(post.payText || post.representativePayText),
    });

  return {
    ...post,
    title: buildPublicTitleSummary({
      sigungu: post.sigungu,
      dongOrStation: post.dongOrStation,
      jobType: "substitute",
      audienceTypes: post.audienceTypes,
      subjectTypes: post.subjectTypes,
    }),
    summary: null,
    // locationText / academyName 유지
    payText: null,
    representativePayText: paySummary,
    sessions: post.sessions.map(redactSession),
  };
}

export function redactBalletmaniaSubstituteDetail(
  post: SubstitutePostDetail,
): SubstitutePostDetail {
  if (!isBalletmaniaSource(post.source)) return post;

  const summary = redactBalletmaniaSubstituteSummary(post);
  return {
    ...post,
    ...summary,
    body: null,
    requirements: [],
    applicationInstructions: null,
    notes: [],
    contactMethods: [],
    contactEmails: [],
    contactPhones: [],
    classification: null,
    representativePay: redactRepresentativePay(
      post.representativePay,
      summary.representativePayText,
    ),
  };
}

function redactRepresentativePay(
  pay: RepresentativePay | null | undefined,
  displayText: string | null | undefined,
): RepresentativePay | null {
  if (!pay && !displayText) return null;
  return {
    unit: pay?.unit ?? "unspecified",
    displayText: displayText || "협의",
    minManwon: pay?.minManwon ?? null,
    maxManwon: pay?.maxManwon ?? null,
    evidence: null,
    confidence: pay?.confidence ?? "low",
    hasConflict: false,
    alternateEvidence: null,
  };
}

function redactSession(session: SubstituteSession): SubstituteSession {
  return {
    ...session,
    evidence: null,
    pay: session.pay
      ? {
          ...session.pay,
          evidence: null,
        }
      : null,
  };
}

function paySummaryFromSessions(sessions: SubstituteSession[]): string | null {
  const pays = sessions.map((session) => session.pay).filter(Boolean);
  if (pays.length === 0) return null;
  const mins = pays.map((pay) => pay?.minManwon).filter((v): v is number => v != null);
  const maxes = pays.map((pay) => pay?.maxManwon).filter((v): v is number => v != null);
  if (mins.length === 0 && maxes.length === 0) return null;
  return buildPublicPaySummary({
    payMinManwon: mins.length ? Math.min(...mins) : null,
    payMaxManwon: maxes.length ? Math.max(...maxes) : null,
  });
}

function firstLabel(values: string[] | null | undefined): string | null {
  if (!values?.length) return null;
  return trimText(values[0]);
}

/** 일반 '발레'는 앱 기본값이라 숨기고, 바레·발레핏 등 구분 과목만 제목에 넣는다. */
function publicSubjectLabels(
  subjectTypes: string[] | null | undefined,
  audience: string | null,
): string[] {
  const labels: string[] = [];
  for (const raw of subjectTypes ?? []) {
    const code = trimText(raw);
    if (!code || isGenericBalletSubject(code)) continue;
    const label = formatSubjectType(code);
    if (!label || label === audience || isGenericBalletSubject(label)) continue;
    if (labels.includes(label)) continue;
    labels.push(label);
  }
  return labels;
}

function isGenericBalletSubject(value: string): boolean {
  return value === "ballet" || value === "발레";
}

function trimText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatManwon(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10);
}
