export const MAX_INTEREST_REGIONS = 50;

export type InterestRegion = {
  id: string;
  sido: string;
  sigungu: string;
};

export function interestRegionKey(sido: string, sigungu: string) {
  return `${sido}::${sigungu}`;
}
