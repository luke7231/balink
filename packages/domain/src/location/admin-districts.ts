const SIDO_ALIASES: Record<string, string> = {
  서울: "서울특별시",
  서울시: "서울특별시",
  서울특별시: "서울특별시",
  부산: "부산광역시",
  부산시: "부산광역시",
  부산광역시: "부산광역시",
  대구: "대구광역시",
  대구시: "대구광역시",
  대구광역시: "대구광역시",
  인천: "인천광역시",
  인천시: "인천광역시",
  인천광역시: "인천광역시",
  광주: "광주광역시",
  광주시: "광주광역시",
  광주광역시: "광주광역시",
  대전: "대전광역시",
  대전시: "대전광역시",
  대전광역시: "대전광역시",
  울산: "울산광역시",
  울산시: "울산광역시",
  울산광역시: "울산광역시",
  세종: "세종특별자치시",
  세종시: "세종특별자치시",
  세종특별자치시: "세종특별자치시",
  경기: "경기도",
  경기도: "경기도",
  강원: "강원특별자치도",
  강원도: "강원특별자치도",
  강원특별자치도: "강원특별자치도",
  충북: "충청북도",
  충청북도: "충청북도",
  충남: "충청남도",
  충청남도: "충청남도",
  전북: "전북특별자치도",
  전라북도: "전북특별자치도",
  전북특별자치도: "전북특별자치도",
  전남: "전라남도",
  전라남도: "전라남도",
  경북: "경상북도",
  경상북도: "경상북도",
  경남: "경상남도",
  경상남도: "경상남도",
  제주: "제주특별자치도",
  제주도: "제주특별자치도",
  제주특별자치도: "제주특별자치도",
};

const SIGUNGU_BY_SIDO: Record<string, readonly string[]> = {
  서울특별시: [
    "종로구",
    "중구",
    "용산구",
    "성동구",
    "광진구",
    "동대문구",
    "중랑구",
    "성북구",
    "강북구",
    "도봉구",
    "노원구",
    "은평구",
    "서대문구",
    "마포구",
    "양천구",
    "강서구",
    "구로구",
    "금천구",
    "영등포구",
    "동작구",
    "관악구",
    "서초구",
    "강남구",
    "송파구",
    "강동구",
  ],
  경기도: [
    "수원시",
    "성남시",
    "고양시",
    "용인시",
    "부천시",
    "안산시",
    "안양시",
    "남양주시",
    "화성시",
    "평택시",
    "의정부시",
    "시흥시",
    "파주시",
    "김포시",
    "광명시",
    "광주시",
    "군포시",
    "하남시",
    "오산시",
    "이천시",
    "안성시",
    "양주시",
    "구리시",
    "포천시",
    "의왕시",
    "여주시",
    "동두천시",
    "과천시",
    "가평군",
    "양평군",
  ],
  인천광역시: ["중구", "동구", "미추홀구", "연수구", "남동구", "부평구", "계양구", "서구", "강화군", "옹진군"],
  부산광역시: [
    "중구",
    "서구",
    "동구",
    "영도구",
    "부산진구",
    "동래구",
    "남구",
    "북구",
    "해운대구",
    "사하구",
    "금정구",
    "강서구",
    "연제구",
    "수영구",
    "사상구",
    "기장군",
  ],
  대구광역시: ["중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군", "군위군"],
  광주광역시: ["동구", "서구", "남구", "북구", "광산구"],
  대전광역시: ["동구", "중구", "서구", "유성구", "대덕구"],
  울산광역시: ["중구", "남구", "동구", "북구", "울주군"],
  세종특별자치시: ["세종시"],
  제주특별자치도: ["제주시", "서귀포시"],
};

export function normalizeSido(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return SIDO_ALIASES[trimmed] ?? (Object.values(SIDO_ALIASES).includes(trimmed) ? trimmed : null);
}

export function normalizeSigungu(sido: string, value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const allowed = SIGUNGU_BY_SIDO[sido];
  if (!allowed) return trimmed;

  const exact = allowed.find((item) => item === trimmed);
  if (exact) return exact;

  const partial = allowed.find((item) => trimmed.startsWith(item.replace(/(시|군|구)$/, "")) || item.startsWith(trimmed));
  return partial ?? trimmed;
}

export function isValidAdminDistrict(sido: string | null, sigungu: string | null): boolean {
  if (!sido || !sigungu) return false;
  const normalizedSido = normalizeSido(sido);
  if (!normalizedSido) return false;
  const allowed = SIGUNGU_BY_SIDO[normalizedSido];
  if (!allowed) return Boolean(sigungu.trim());
  return allowed.some((item) => item === sigungu || sigungu.startsWith(item.replace(/(시|군|구)$/, "")));
}

export function validateAdminDistrict(
  sido: string | null | undefined,
  sigungu: string | null | undefined,
): { sido: string | null; sigungu: string | null; valid: boolean } {
  const normalizedSido = normalizeSido(sido);
  const normalizedSigungu = normalizedSido ? normalizeSigungu(normalizedSido, sigungu) : null;
  return {
    sido: normalizedSido,
    sigungu: normalizedSigungu,
    valid: isValidAdminDistrict(normalizedSido, normalizedSigungu),
  };
}

export function parseAddressTokens(address: string): { sido: string | null; sigungu: string | null; dongOrStation: string | null } {
  const tokens = address.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return { sido: null, sigungu: null, dongOrStation: null };
  }

  const sido = normalizeSido(tokens[0]);
  const sigungu = sido && tokens[1] ? normalizeSigungu(sido, tokens[1]) : null;
  const dongOrStation =
    tokens.find((token) => /(동|읍|면|리|역)$/.test(token)) ??
    tokens[2] ??
    null;

  return { sido, sigungu, dongOrStation };
}

export const KNOWN_SIDO = [...new Set(Object.values(SIDO_ALIASES))];
