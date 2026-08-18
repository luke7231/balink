/** 채용 보드(employ)에서 온 대강을 워킹보드 id와 구분하기 위한 prefix */
export const EMPLOY_SUBSTITUTE_SOURCE_POST_ID_PREFIX = "employ:";

export function toEmploySubstituteSourcePostId(sourcePostId: string): string {
  if (sourcePostId.startsWith(EMPLOY_SUBSTITUTE_SOURCE_POST_ID_PREFIX)) return sourcePostId;
  return `${EMPLOY_SUBSTITUTE_SOURCE_POST_ID_PREFIX}${sourcePostId}`;
}

export function isEmploySubstituteSourcePostId(sourcePostId: string | null | undefined): boolean {
  return Boolean(sourcePostId?.startsWith(EMPLOY_SUBSTITUTE_SOURCE_POST_ID_PREFIX));
}

export function isEmployBoardSourceUrl(sourceUrl: string | null | undefined): boolean {
  if (!sourceUrl) return false;
  return /employ_detail\.html|esangdance\.(?:net|co\.kr)/i.test(sourceUrl);
}

/** 채용 분류 결과가 대강(SubstitutePost)으로 가야 하는지 */
export function shouldRouteEmployListingToSubstitute(jobType: string | null | undefined): boolean {
  return jobType === "substitute";
}

/**
 * 채용 공고 텍스트에서 jobType 휴리스틱.
 * `당일`/`이번주`만으로는 substitute 확정하지 않고, 날짜 단서가 있을 때만 허용.
 */
export function classifyEmployJobType(text: string): "regular" | "substitute" | "one_time" {
  if (/대타\s*가\s*아닌|대타\s*아닌/.test(text)) {
    // fall through
  } else if (/대타|대강/.test(text)) {
    return "substitute";
  } else if (/(?:당일|이번\s*주)/.test(text) && hasSubstituteDateCue(text)) {
    return "substitute";
  }

  if (/단기|이벤트|특강/.test(text)) return "one_time";
  if (/정식|오래|장기|고정|매주|월\s*~\s*금|월~금|함께/.test(text)) return "regular";
  return "regular";
}

function hasSubstituteDateCue(text: string): boolean {
  return /\d{1,2}\s*일|\d{1,2}\s*[\/.]\s*\d{1,2}|\d{4}-\d{2}-\d{2}/.test(text);
}
