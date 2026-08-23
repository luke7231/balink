export {
  BASE_INTEREST_REGION_LIMIT,
  FREE_INTEREST_REGION_LIMIT,
  MAX_INTEREST_REGIONS,
  REFERRED_INTEREST_REGION_LIMIT,
  interestRegionKey,
} from "@balink/domain";

export function regionLimitError(referred: boolean) {
  return referred
    ? "관심지역은 두 곳까지입니다. 친구 한 명을 초대하면 무제한으로 열립니다."
    : "관심지역은 한 곳까지입니다. 친구 코드를 넣으면 하나 더, 친구 한 명을 초대하면 무제한입니다.";
}

export type InterestRegion = {
  id: string;
  sido: string;
  sigungu: string;
};
