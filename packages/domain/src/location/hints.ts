import { normalizeSido, normalizeSigungu, parseAddressTokens } from "./admin-districts.js";

const SUBSTITUTE_REGION_LINE_PATTERN = /▶\s*지역\s*:\s*([^\n]+)/g;

const LOCATION_HINT_PATTERNS = [
  /([가-힣]{2,8}(?:특별시|광역시|특별자치시|도))\s+([가-힣0-9]+(?:시|군|구))/g,
  /([가-힣]{2,8}(?:특별시|광역시|특별자치시|도))\s+([가-힣0-9]+(?:시|군|구))\s+([가-힣0-9]+(?:동|읍|면|역))/g,
  /(?:^|[\s·|,])((?:서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)(?:시|도)?)\s+([가-힣0-9]+(?:시|군|구))/g,
  /([가-힣A-Za-z0-9]{2,}역)\s*(?:인근|부근|근처|앞|옆)?/g,
];

export interface LocationHint {
  sido: string | null;
  sigungu: string | null;
  dongOrStation: string | null;
  evidence: string;
  source: "title" | "description";
}

export function extractLocationHints(title: string, description: string): LocationHint[] {
  const hints: LocationHint[] = [];
  const sources: Array<{ text: string; source: "title" | "description" }> = [
    { text: title, source: "title" },
    { text: description, source: "description" },
  ];

  for (const { text, source } of sources) {
    if (!text) continue;

    SUBSTITUTE_REGION_LINE_PATTERN.lastIndex = 0;
    let regionLineMatch: RegExpExecArray | null;
    while ((regionLineMatch = SUBSTITUTE_REGION_LINE_PATTERN.exec(text)) !== null) {
      const evidence = regionLineMatch[0].trim();
      hints.push({
        ...parseAddressTokens(regionLineMatch[1]?.trim() ?? evidence),
        evidence,
        source,
      });
    }

    for (const pattern of LOCATION_HINT_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const evidence = match[0].trim();
        const parsed =
          match.length >= 4
            ? {
                sido: normalizeSido(match[1]),
                sigungu: match[2] ? normalizeSigungu(normalizeSido(match[1]) ?? "", match[2]) : null,
                dongOrStation: match[3] ?? null,
              }
            : match.length >= 3
              ? {
                  sido: normalizeSido(match[1]),
                  sigungu: match[2] ? normalizeSigungu(normalizeSido(match[1]) ?? "", match[2]) : null,
                  dongOrStation: null,
                }
              : parseAddressTokens(evidence);

        hints.push({
          ...parsed,
          evidence,
          source,
        });
      }
    }
  }

  return dedupeHints(hints);
}

function dedupeHints(hints: LocationHint[]): LocationHint[] {
  const seen = new Set<string>();
  const unique: LocationHint[] = [];

  for (const hint of hints) {
    const key = [hint.sido, hint.sigungu, hint.dongOrStation, hint.source].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(hint);
  }

  return unique;
}
