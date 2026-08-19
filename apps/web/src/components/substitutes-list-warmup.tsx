"use client";

import { useEffect } from "react";
import {
  SubstitutePostsDocument,
  type SubstitutePostsQuery,
} from "@/generated/graphql";
import { browserGraphqlRequest } from "@/lib/graphql/browser-client";
import { readListCache, writeListCache } from "@/lib/list-cache";
import { SUBSTITUTE_SORT_DEFAULT, toSubstitutePostSortEnum } from "@/lib/list-sort";

const CACHE_KEY = `substitute-posts-open:${SUBSTITUTE_SORT_DEFAULT}`;

/** 홈 체류 중 대강 목록을 백그라운드로 채워 탭 전환 빈화면을 줄인다 */
export function SubstitutesListWarmup() {
  useEffect(() => {
    if (readListCache(CACHE_KEY)) return;

    let cancelled = false;
    const run = () => {
      void (async () => {
        try {
          const result = await browserGraphqlRequest<SubstitutePostsQuery>(
            SubstitutePostsDocument,
            {
              pagination: { page: 1, limit: 100 },
              filter: { status: "OPEN" },
              sort: toSubstitutePostSortEnum(SUBSTITUTE_SORT_DEFAULT),
            },
          );
          if (cancelled) return;
          writeListCache(CACHE_KEY, {
            items: result.substitutePosts.items,
            total: result.substitutePosts.pageInfo.total,
          });
        } catch {
          // ignore
        }
      })();
    };

    const ric = window.requestIdleCallback?.(run, { timeout: 2500 });
    if (ric == null) {
      const timer = window.setTimeout(run, 600);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    return () => {
      cancelled = true;
      window.cancelIdleCallback?.(ric);
    };
  }, []);

  return null;
}
