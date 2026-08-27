export const BASE_INTEREST_REGION_LIMIT = 1;
export const REFERRED_INTEREST_REGION_LIMIT = 2;
export const MAX_INTEREST_REGIONS = 50;

/** @deprecated 기본 한도는 BASE, 코드 입력 후는 REFERRED */
export const FREE_INTEREST_REGION_LIMIT = BASE_INTEREST_REGION_LIMIT;

export function interestRegionKey(sido: string, sigungu: string) {
  return `${sido.trim()}::${sigungu.trim()}`;
}

export function uniqueInterestRegionCount(
  regions: Array<{ sido?: string | null; sigungu?: string | null }>,
): number {
  const keys = new Set<string>();
  for (const region of regions) {
    const sido = region.sido?.trim() ?? "";
    const sigungu = region.sigungu?.trim() ?? "";
    if (!sido || !sigungu) continue;
    keys.add(interestRegionKey(sido, sigungu));
  }
  return keys.size;
}

export function allowedInterestRegionCount(input: {
  unlocked: boolean;
  referred: boolean;
}): number {
  if (input.unlocked) return MAX_INTEREST_REGIONS;
  return input.referred ? REFERRED_INTEREST_REGION_LIMIT : BASE_INTEREST_REGION_LIMIT;
}

/** 잠금이 열린 뒤에도 남용을 막는 절대 상한 */
export function exceedsHardInterestRegionLimit(nextUniqueCount: number): boolean {
  return nextUniqueCount > MAX_INTEREST_REGIONS;
}

/**
 * 기본 1곳. 친구 코드를 넣으면 2곳. 내가 초대한 친구가 내 코드를 넣으면 무제한.
 * 이미 한도보다 많은 기존 사용자는 그 개수를 유지·수정할 수 있고, 더 늘릴 때만 막는다.
 */
export function exceedsFreeInterestRegionLimit(input: {
  unlocked: boolean;
  referred: boolean;
  currentUniqueCount: number;
  nextUniqueCount: number;
}): boolean {
  if (exceedsHardInterestRegionLimit(input.nextUniqueCount)) return true;
  if (input.unlocked) return false;
  const allowed = allowedInterestRegionCount(input);
  if (input.nextUniqueCount <= allowed) return false;
  return input.nextUniqueCount > input.currentUniqueCount;
}
