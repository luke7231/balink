import type { NormalizedLocation } from "@balink/domain";
import {
  extractLocationHints,
  formatAdminLocationDisplay,
  parseAddressTokens,
  validateAdminDistrict,
} from "@balink/domain";
import { fetch } from "undici";

export interface GeocodeLocationInput {
  title: string;
  description: string;
  company: string | null;
  locationText: string | null;
  parsedSido: string | null;
  parsedSigungu: string | null;
  parsedDongOrStation: string | null;
  parsedConfidence: NormalizedLocation["confidence"];
}

interface KakaoSearchDocument {
  place_name?: string;
  address_name?: string;
  road_address_name?: string;
  category_name?: string;
}

export async function geocodeLocation(input: GeocodeLocationInput): Promise<NormalizedLocation> {
  const validated = validateAdminDistrict(input.parsedSido, input.parsedSigungu);
  if (validated.valid) {
    return buildNormalizedLocation(
      "llm",
      validated.sido,
      validated.sigungu,
      input.parsedDongOrStation,
      input.parsedConfidence,
    );
  }

  const hints = extractLocationHints(input.title, input.description);
  const hint = hints.find((item) => validateAdminDistrict(item.sido, item.sigungu).valid);
  if (hint) {
    return buildNormalizedLocation(
      "hint",
      hint.sido,
      hint.sigungu,
      hint.dongOrStation ?? input.parsedDongOrStation,
      "medium",
    );
  }

  const kakaoResult = await searchKakaoLocal(buildKakaoQuery(input));
  if (kakaoResult) {
    return kakaoResult;
  }

  return {
    source: "raw",
    locationText: null,
    sido: null,
    sigungu: null,
    dongOrStation: null,
    confidence: "low",
  };
}

function buildNormalizedLocation(
  source: NormalizedLocation["source"],
  sido: string | null,
  sigungu: string | null,
  dongOrStation: string | null,
  confidence: NormalizedLocation["confidence"],
): NormalizedLocation {
  return {
    source,
    locationText: formatAdminLocationDisplay(sido, sigungu, dongOrStation),
    sido,
    sigungu,
    dongOrStation,
    confidence,
  };
}

function buildKakaoQuery(input: GeocodeLocationInput): string | null {
  const academyName = input.company?.trim();
  const regionHint = input.locationText?.trim();
  if (!academyName && !regionHint) return null;
  if (academyName && regionHint && !looksLikeAcademyOnly(regionHint)) {
    return `${academyName} ${regionHint}`;
  }
  return academyName || regionHint || null;
}

function looksLikeAcademyOnly(value: string): boolean {
  return !/(특별시|광역시|특별자치|도|시|군|구|동|역)/.test(value);
}

async function searchKakaoLocal(query: string | null): Promise<NormalizedLocation | null> {
  if (!query) return null;

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", query);
  url.searchParams.set("size", "5");

  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${apiKey}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { documents?: KakaoSearchDocument[] };
  const documents = payload.documents ?? [];
  if (documents.length !== 1) {
    return null;
  }

  const doc = documents[0];
  const address = doc.road_address_name || doc.address_name;
  if (!address) return null;

  if (!isAcademyCategory(doc.category_name)) {
    return null;
  }

  const parsed = parseAddressTokens(address);
  const validated = validateAdminDistrict(parsed.sido, parsed.sigungu);
  if (!validated.valid) {
    return null;
  }

  return {
    source: "kakao",
    locationText: formatAdminLocationDisplay(validated.sido, validated.sigungu, parsed.dongOrStation),
    sido: validated.sido,
    sigungu: validated.sigungu,
    dongOrStation: parsed.dongOrStation ?? null,
    confidence: "high",
  };
}

function isAcademyCategory(categoryName: string | undefined): boolean {
  if (!categoryName) return true;
  return /학원|교육|무용|예체능|체육|문화|센터/.test(categoryName);
}

export { searchKakaoLocal, buildKakaoQuery, looksLikeAcademyOnly };
