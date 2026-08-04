import type { PayUnit, RepresentativePay } from "../formatted-post.js";

export const PAY_UNIT_LABELS: Record<PayUnit, string> = {
  hourly: "시간당",
  per_class: "회당",
  daily: "일당",
  weekly: "주급",
  monthly: "월급",
  lump_sum: "총액",
  variable: "타임별 상이",
  negotiable: "추후 협의",
  unspecified: "미기재",
};

const PAY_UNIT_PATTERNS: Array<{ unit: PayUnit; pattern: RegExp }> = [
  { unit: "hourly", pattern: /시간당\s*(\d[\d,]*(?:\.\d+)?)\s*(?:만\s*원|만원|원)?/ },
  { unit: "per_class", pattern: /회당\s*(\d[\d,]*(?:\.\d+)?)\s*(?:만\s*원|만원|원)?/ },
  { unit: "daily", pattern: /일당\s*(\d[\d,]*(?:\.\d+)?)\s*(?:만\s*원|만원|원)?/ },
  { unit: "weekly", pattern: /주급\s*(\d[\d,]*(?:\.\d+)?)\s*(?:만\s*원|만원|원)?/ },
  { unit: "monthly", pattern: /월급\s*(\d[\d,]*(?:\.\d+)?)\s*(?:만\s*원|만원|원)?/ },
];

const CURRENCY_AMOUNT_PATTERNS = [
  /(\d[\d,]*(?:\.\d+)?)\s*(?:만\s*원|만원)/g,
  /(\d[\d,]*(?:\.\d+)?)\s*원(?![가-힣])/g,
];

const NON_PAY_SUFFIX_PATTERN = /^(?:평|pyeong|㎡|m²|m2|명|세|살|cm|mm|kg|km|개|층|호|번지|동|역|일|월|년|시|분|초)/i;

export function formatManwonAmount(value: number): string {
  if (Number.isInteger(value)) return `${value}만원`;
  const normalized = Number(value.toFixed(1));
  return `${normalized}만원`;
}

export function formatRepresentativePayDisplay(pay: RepresentativePay): string {
  if (pay.unit === "negotiable") return PAY_UNIT_LABELS.negotiable;
  if (pay.unit === "variable") return PAY_UNIT_LABELS.variable;
  if (pay.unit === "unspecified") return PAY_UNIT_LABELS.unspecified;

  if (pay.unit === "lump_sum") {
    if (pay.minManwon != null && pay.maxManwon != null && pay.minManwon !== pay.maxManwon) {
      return `${formatManwonAmount(pay.minManwon)}~${formatManwonAmount(pay.maxManwon)}`;
    }
    if (pay.minManwon != null) return formatManwonAmount(pay.minManwon);
    if (pay.maxManwon != null) return formatManwonAmount(pay.maxManwon);
    return PAY_UNIT_LABELS.unspecified;
  }

  const label = PAY_UNIT_LABELS[pay.unit];
  if (pay.minManwon != null && pay.maxManwon != null && pay.minManwon !== pay.maxManwon) {
    return `${label} ${formatManwonAmount(pay.minManwon)}~${formatManwonAmount(pay.maxManwon)}`;
  }
  if (pay.minManwon != null) return `${label} ${formatManwonAmount(pay.minManwon)}`;
  if (pay.maxManwon != null) return `${label} ${formatManwonAmount(pay.maxManwon)}`;
  return label;
}

const PAY_SLANG_PATTERN = /페이(?:는|이|[:\s_])*\s*(\d+(?:\.\d+)?)/i;

export function parsePaySlangFromText(text: string): {
  unit: PayUnit;
  minManwon: number | null;
  maxManwon: number | null;
  evidence: string;
} | null {
  const match = text.match(PAY_SLANG_PATTERN);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 50) return null;

  return {
    unit: "lump_sum",
    minManwon: amount,
    maxManwon: amount,
    evidence: match[0].trim(),
  };
}

/** 대타 게시글 본문 끝에 '45000'처럼 원화만 단독 기재된 경우 */
export function parseBareWonPayFromText(text: string): {
  unit: PayUnit;
  minManwon: number | null;
  maxManwon: number | null;
  evidence: string;
} | null {
  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (!/^\d{4,6}$/.test(line)) continue;

    const won = Number(line);
    if (!Number.isFinite(won) || won < 25_000 || won > 300_000) continue;
    if (line.startsWith("010")) continue;

    const manwon = won / 10_000;
    return {
      unit: "lump_sum",
      minManwon: manwon,
      maxManwon: manwon,
      evidence: line,
    };
  }

  return null;
}

export function parsePayFromAnyText(text: string | null | undefined): {
  unit: PayUnit;
  minManwon: number | null;
  maxManwon: number | null;
  evidence: string;
} | null {
  if (!text?.trim()) return null;
  return parsePaySlangFromText(text) ?? parseExplicitPayFromText(text) ?? parseBareWonPayFromText(text);
}

export function parseExplicitPayFromText(text: string): {
  unit: PayUnit;
  minManwon: number | null;
  maxManwon: number | null;
  evidence: string;
} | null {
  for (const matcher of PAY_UNIT_PATTERNS) {
    const match = text.match(matcher.pattern);
    if (!match || !isPayMatchInContext(text, match.index ?? 0, match[0])) continue;
    const amount = parseAmountToManwon(match[1], match[0]);
    if (amount == null || !isPlausiblePayAmount(matcher.unit, amount, match[0])) continue;
    return { unit: matcher.unit, minManwon: amount, maxManwon: amount, evidence: match[0].trim() };
  }

  for (const pattern of CURRENCY_AMOUNT_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      if (!isPayMatchInContext(text, match.index, match[0])) continue;
      const amount = parseAmountToManwon(match[1], match[0]);
      if (amount == null || !isPlausiblePayAmount("hourly", amount, match[0])) continue;
      return { unit: "hourly", minManwon: amount, maxManwon: amount, evidence: match[0].trim() };
    }
  }

  return null;
}

export function resolveRepresentativePayConflict(
  llmPay: RepresentativePay,
  title: string,
  description: string,
  summaryPayText: string | null,
): RepresentativePay {
  const explicitSources: Array<{
    unit: PayUnit;
    minManwon: number | null;
    maxManwon: number | null;
    evidence: string;
  }> = [];

  const summarySlang = parsePaySlangFromText(summaryPayText ?? "");
  if (summarySlang) explicitSources.push(summarySlang);

  for (const text of [title, description]) {
    const slang = parsePaySlangFromText(text);
    if (slang) explicitSources.push(slang);
    const explicit = parseExplicitPayFromText(text);
    if (explicit) explicitSources.push(explicit);
    const bareWon = parseBareWonPayFromText(text);
    if (bareWon) explicitSources.push(bareWon);
  }

  if (summaryPayText && !isRangeSummary(summaryPayText)) {
    const summaryExplicit = parseExplicitPayFromText(summaryPayText);
    if (summaryExplicit) explicitSources.push(summaryExplicit);
  }

  const sanitizedLlmPay = normalizePaySlangRepresentativePay(
    sanitizeRepresentativePay(llmPay, summaryPayText),
    summaryPayText,
  );

  if (explicitSources.length === 0) {
    return sanitizedLlmPay;
  }

  if (shouldPreferLlmPay(sanitizedLlmPay)) {
    return sanitizedLlmPay;
  }

  const preferred = explicitSources[0];
  const summaryConflict =
    summaryPayText &&
    sanitizedLlmPay.hasConflict &&
    !summaryPayText.includes(String(preferred.minManwon ?? "")) &&
    summaryPayText.trim().length > 0;

  const displayText = formatRepresentativePayDisplay({
    unit: preferred.unit,
    displayText: "",
    minManwon: preferred.minManwon,
    maxManwon: preferred.maxManwon,
    evidence: preferred.evidence,
    confidence: "high",
    hasConflict: false,
    alternateEvidence: null,
  });

  return {
    unit: preferred.unit,
    displayText,
    minManwon: preferred.minManwon,
    maxManwon: preferred.maxManwon,
    evidence: preferred.evidence,
    confidence: "high",
    hasConflict: Boolean(summaryConflict || sanitizedLlmPay.hasConflict),
    alternateEvidence: summaryConflict ? summaryPayText : sanitizedLlmPay.alternateEvidence,
  };
}

export function sanitizeRepresentativePay(
  pay: RepresentativePay,
  summaryPayText: string | null,
): RepresentativePay {
  if (isNegotiableSummary(summaryPayText) && !isPlausibleRepresentativePay(pay)) {
    return {
      unit: "negotiable",
      displayText: PAY_UNIT_LABELS.negotiable,
      minManwon: null,
      maxManwon: null,
      evidence: summaryPayText,
      confidence: "high",
      hasConflict: false,
      alternateEvidence: pay.evidence,
    };
  }

  if (!isPlausibleRepresentativePay(pay)) {
    return defaultRepresentativePay();
  }

  return pay;
}

/** LLM structured output only — no re-parsing of source text. */
export function finalizeRepresentativePay(pay: RepresentativePay): RepresentativePay {
  if (!isPlausibleRepresentativePay(pay)) {
    return defaultRepresentativePay();
  }

  return {
    ...pay,
    displayText: formatRepresentativePayDisplay(pay),
  };
}

export function defaultRepresentativePay(): RepresentativePay {
  return {
    unit: "unspecified",
    displayText: PAY_UNIT_LABELS.unspecified,
    minManwon: null,
    maxManwon: null,
    evidence: null,
    confidence: "low",
    hasConflict: false,
    alternateEvidence: null,
  };
}

function parseAmountToManwon(rawAmount: string, context: string): number | null {
  const numeric = Number(rawAmount.replace(/,/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  if (/만\s*원|만원/.test(context)) return numeric;
  if (/원/.test(context)) return numeric / 10000;
  return null;
}

function isPayMatchInContext(text: string, index: number, matchText: string): boolean {
  const after = text.slice(index + matchText.length);
  const suffix = after.trimStart();
  if (NON_PAY_SUFFIX_PATTERN.test(suffix)) return false;
  if (/^\d/.test(suffix)) return false;
  if (/^\/\d/.test(text.slice(Math.max(0, index - 3), index + matchText.length + 3))) return false;
  if (/\d\/\d/.test(text.slice(Math.max(0, index - 2), index + matchText.length + 2))) return false;
  if (/\d-\d/.test(matchText) || /010/.test(text.slice(Math.max(0, index - 4), index + matchText.length + 4))) {
    return false;
  }
  return true;
}

function isPlausiblePayAmount(unit: PayUnit, amountManwon: number, evidence: string): boolean {
  if (parsePaySlangFromText(evidence)) return amountManwon > 0 && amountManwon <= 50;
  if (/^\d{4,6}$/.test(evidence.trim())) {
    const won = Number(evidence);
    return won >= 25_000 && won <= 300_000;
  }
  if (!/(?:시간당|회당|일당|주급|월급|만\s*원|만원|원)/.test(evidence)) return false;
  if (unit === "hourly" && amountManwon > 50) return false;
  if (unit === "per_class" && amountManwon > 100) return false;
  if (unit === "daily" && amountManwon > 200) return false;
  if (unit === "lump_sum" && amountManwon > 200) return false;
  return amountManwon > 0;
}

function normalizePaySlangRepresentativePay(
  pay: RepresentativePay,
  summaryPayText: string | null,
): RepresentativePay {
  const slangSource = [pay.evidence, pay.displayText, summaryPayText]
    .map((text) => parsePaySlangFromText(text ?? ""))
    .find((value): value is NonNullable<typeof value> => value != null);

  if (!slangSource) return pay;

  return {
    unit: slangSource.unit,
    minManwon: slangSource.minManwon,
    maxManwon: slangSource.maxManwon,
    evidence: slangSource.evidence,
    displayText: formatRepresentativePayDisplay({
      unit: slangSource.unit,
      displayText: "",
      minManwon: slangSource.minManwon,
      maxManwon: slangSource.maxManwon,
      evidence: slangSource.evidence,
      confidence: pay.confidence,
      hasConflict: pay.hasConflict,
      alternateEvidence: pay.alternateEvidence,
    }),
    confidence: pay.confidence === "low" ? "high" : pay.confidence,
    hasConflict: pay.hasConflict,
    alternateEvidence: pay.alternateEvidence,
  };
}

function shouldPreferLlmPay(pay: RepresentativePay): boolean {
  if (pay.unit === "unspecified") return false;
  if (pay.unit === "negotiable" || pay.unit === "variable") {
    return pay.confidence !== "low" || Boolean(pay.evidence?.trim());
  }
  if (pay.confidence === "low") return false;
  return isPlausibleRepresentativePay(pay);
}

function isPlausibleRepresentativePay(pay: RepresentativePay): boolean {
  if (pay.unit === "negotiable" || pay.unit === "variable" || pay.unit === "unspecified") return true;
  if (pay.minManwon == null && pay.maxManwon == null) return false;
  const amount = pay.minManwon ?? pay.maxManwon ?? 0;
  return isPlausiblePayAmount(pay.unit, amount, pay.evidence ?? pay.displayText);
}

function isNegotiableSummary(summaryPayText: string | null | undefined): boolean {
  if (!summaryPayText?.trim()) return false;
  return /협의|협의후|면접|미기재|미정|별도/.test(summaryPayText);
}

function isRangeSummary(summaryPayText: string): boolean {
  return /~\s*\d|~\d/.test(summaryPayText);
}
