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
  인천광역시: [
    "중구",
    "동구",
    "미추홀구",
    "연수구",
    "남동구",
    "부평구",
    "계양구",
    "서구",
    "강화군",
    "옹진군",
  ],
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
  대구광역시: [
    "중구",
    "동구",
    "서구",
    "남구",
    "북구",
    "수성구",
    "달서구",
    "달성군",
    "군위군",
  ],
  광주광역시: ["동구", "서구", "남구", "북구", "광산구"],
  대전광역시: ["동구", "중구", "서구", "유성구", "대덕구"],
  울산광역시: ["중구", "남구", "동구", "북구", "울주군"],
  세종특별자치시: ["세종시"],
  제주특별자치도: ["제주시", "서귀포시"],
  강원특별자치도: [
    "춘천시",
    "원주시",
    "강릉시",
    "동해시",
    "태백시",
    "속초시",
    "삼척시",
    "홍천군",
    "횡성군",
    "영월군",
    "평창군",
    "정선군",
    "철원군",
    "화천군",
    "양구군",
    "인제군",
    "고성군",
    "양양군",
  ],
  충청북도: [
    "청주시",
    "충주시",
    "제천시",
    "보은군",
    "옥천군",
    "영동군",
    "증평군",
    "진천군",
    "괴산군",
    "음성군",
    "단양군",
  ],
  충청남도: [
    "천안시",
    "공주시",
    "보령시",
    "아산시",
    "서산시",
    "논산시",
    "계룡시",
    "당진시",
    "금산군",
    "부여군",
    "서천군",
    "청양군",
    "홍성군",
    "예산군",
    "태안군",
  ],
  전북특별자치도: [
    "전주시",
    "군산시",
    "익산시",
    "정읍시",
    "남원시",
    "김제시",
    "완주군",
    "진안군",
    "무주군",
    "장수군",
    "임실군",
    "순창군",
    "고창군",
    "부안군",
  ],
  전라남도: [
    "목포시",
    "여수시",
    "순천시",
    "나주시",
    "광양시",
    "담양군",
    "곡성군",
    "구례군",
    "고흥군",
    "보성군",
    "화순군",
    "장흥군",
    "강진군",
    "해남군",
    "영암군",
    "무안군",
    "함평군",
    "영광군",
    "장성군",
    "완도군",
    "진도군",
    "신안군",
  ],
  경상북도: [
    "포항시",
    "경주시",
    "김천시",
    "안동시",
    "구미시",
    "영주시",
    "영천시",
    "상주시",
    "문경시",
    "경산시",
    "의성군",
    "청송군",
    "영양군",
    "영덕군",
    "청도군",
    "고령군",
    "성주군",
    "칠곡군",
    "예천군",
    "봉화군",
    "울진군",
    "울릉군",
  ],
  경상남도: [
    "창원시",
    "진주시",
    "통영시",
    "사천시",
    "김해시",
    "밀양시",
    "거제시",
    "양산시",
    "의령군",
    "함안군",
    "창녕군",
    "고성군",
    "남해군",
    "하동군",
    "산청군",
    "함양군",
    "거창군",
    "합천군",
  ],
};

export interface AdminDistrictGroup {
  sido: string;
  districts: readonly string[];
}

const PINNED_SIDO_ORDER = ["서울특별시", "경기도"] as const;

export function listAdminDistrictGroups(): AdminDistrictGroup[] {
  const pinRank = new Map<string, number>(
    PINNED_SIDO_ORDER.map((sido, index) => [sido, index]),
  );
  return Object.entries(SIGUNGU_BY_SIDO)
    .map(([sido, districts]) => ({
      sido,
      districts: [...districts].sort((a, b) => a.localeCompare(b, "ko")),
    }))
    .sort((a, b) => {
      const aPin = pinRank.get(a.sido);
      const bPin = pinRank.get(b.sido);
      if (aPin != null || bPin != null) {
        return (
          (aPin ?? Number.POSITIVE_INFINITY) -
          (bPin ?? Number.POSITIVE_INFINITY)
        );
      }
      return a.sido.localeCompare(b.sido, "ko");
    });
}

export function normalizeSido(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return (
    SIDO_ALIASES[trimmed] ??
    (Object.values(SIDO_ALIASES).includes(trimmed) ? trimmed : null)
  );
}

export function normalizeSigungu(
  sido: string,
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const allowed = SIGUNGU_BY_SIDO[sido];
  if (!allowed) return trimmed;

  const exact = allowed.find((item) => item === trimmed);
  if (exact) return exact;

  const partial = allowed.find(
    (item) =>
      trimmed.startsWith(item.replace(/(시|군|구)$/, "")) ||
      item.startsWith(trimmed),
  );
  return partial ?? trimmed;
}

export function isValidAdminDistrict(
  sido: string | null,
  sigungu: string | null,
): boolean {
  if (!sido || !sigungu) return false;
  const normalizedSido = normalizeSido(sido);
  if (!normalizedSido) return false;
  const allowed = SIGUNGU_BY_SIDO[normalizedSido];
  if (!allowed) return Boolean(sigungu.trim());
  return allowed.some(
    (item) =>
      item === sigungu || sigungu.startsWith(item.replace(/(시|군|구)$/, "")),
  );
}

export function validateAdminDistrict(
  sido: string | null | undefined,
  sigungu: string | null | undefined,
): { sido: string | null; sigungu: string | null; valid: boolean } {
  const normalizedSido = normalizeSido(sido);
  const normalizedSigungu = normalizedSido
    ? normalizeSigungu(normalizedSido, sigungu)
    : null;
  return {
    sido: normalizedSido,
    sigungu: normalizedSigungu,
    valid: isValidAdminDistrict(normalizedSido, normalizedSigungu),
  };
}

export function parseAddressTokens(address: string): {
  sido: string | null;
  sigungu: string | null;
  dongOrStation: string | null;
} {
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

  if (sido) {
    return { sido, sigungu, dongOrStation };
  }

  if (tokens[0]?.endsWith("시") && tokens[1]?.endsWith("구")) {
    const inferredSido = inferSidoForSigunguCity(tokens[0]);
    if (inferredSido) {
      return {
        sido: inferredSido,
        sigungu: `${tokens[0]} ${tokens[1]}`,
        dongOrStation: tokens[2] ?? null,
      };
    }
  }

  if (tokens[0]?.endsWith("시") || tokens[0]?.endsWith("군")) {
    const inferredSido = inferSidoForSigunguCity(tokens[0]);
    if (inferredSido) {
      return {
        sido: inferredSido,
        sigungu: tokens[0],
        dongOrStation: tokens[1] ?? null,
      };
    }
  }

  return { sido, sigungu, dongOrStation };
}

function inferSidoForSigunguCity(cityName: string): string | null {
  for (const [sido, cities] of Object.entries(SIGUNGU_BY_SIDO)) {
    if (cities.includes(cityName)) return sido;
  }
  return null;
}

function resolveCityTokenAsSigungu(
  token: string | null | undefined,
): { sido: string; sigungu: string } | null {
  if (!token?.trim()) return null;
  const trimmed = token.trim();
  const candidates = [trimmed];
  if (!/(시|군|구)$/.test(trimmed)) {
    candidates.push(`${trimmed}시`, `${trimmed}군`, `${trimmed}구`);
  }

  for (const candidate of candidates) {
    const sido = inferSidoForSigunguCity(candidate);
    if (sido) return { sido, sigungu: candidate };
  }

  for (const [sido, cities] of Object.entries(SIGUNGU_BY_SIDO)) {
    const match = cities.find(
      (city) => city === trimmed || city.replace(/(시|군|구)$/, "") === trimmed,
    );
    if (match) return { sido, sigungu: match };
  }

  return null;
}

/**
 * Legacy short aliases (서울/경기/인천) and city-as-sido mistakes (부천)
 * into canonical admin district names used for storage/filters.
 */
export function canonicalizeAdminRegion(input: {
  sido?: string | null;
  sigungu?: string | null;
  dongOrStation?: string | null;
}): {
  sido: string | null;
  sigungu: string | null;
  dongOrStation: string | null;
  changed: boolean;
} {
  const originalSido = input.sido?.trim() || null;
  const originalSigungu = input.sigungu?.trim() || null;
  const originalDong =
    input.dongOrStation?.trim() && input.dongOrStation.trim() !== "지역"
      ? input.dongOrStation.trim()
      : null;

  let sido = originalSido;
  let sigungu = originalSigungu;
  let dongOrStation = originalDong;

  if (sido && !normalizeSido(sido)) {
    const cityAsSido = resolveCityTokenAsSigungu(sido);
    if (cityAsSido) {
      if (sigungu && !isValidAdminDistrict(cityAsSido.sido, sigungu)) {
        if (!dongOrStation && /(역|동|읍|면|리)/.test(sigungu)) {
          dongOrStation = sigungu;
        }
        sigungu = cityAsSido.sigungu;
      } else if (!sigungu) {
        sigungu = cityAsSido.sigungu;
      } else {
        sigungu =
          normalizeSigungu(cityAsSido.sido, sigungu) ?? cityAsSido.sigungu;
      }
      sido = cityAsSido.sido;
    }
  }

  const normalizedSido = normalizeSido(sido);
  if (!normalizedSido) {
    // Academy names / junk tokens that were stored as sido (e.g. KBEC발레아카데미)
    if (originalSido) {
      return {
        sido: null,
        sigungu: null,
        dongOrStation: originalDong,
        changed: true,
      };
    }
    return {
      sido: null,
      sigungu: originalSigungu,
      dongOrStation: originalDong,
      changed: false,
    };
  }

  let normalizedSigungu = sigungu;
  if (sigungu && !isValidAdminDistrict(normalizedSido, sigungu)) {
    const candidate = normalizeSigungu(normalizedSido, sigungu);
    if (candidate && isValidAdminDistrict(normalizedSido, candidate)) {
      normalizedSigungu = candidate;
    } else {
      if (!dongOrStation && /(역|동|읍|면|리)/.test(sigungu)) {
        dongOrStation = sigungu;
      }
      normalizedSigungu = null;
    }
  }

  const changed =
    normalizedSido !== originalSido ||
    normalizedSigungu !== originalSigungu ||
    dongOrStation !== originalDong;

  return {
    sido: normalizedSido,
    sigungu: normalizedSigungu,
    dongOrStation,
    changed,
  };
}

export const KNOWN_SIDO = [...new Set(Object.values(SIDO_ALIASES))];
