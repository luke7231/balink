import { SubstitutePostRepository } from "@balink/db";
import {
  deriveSubstituteStatus,
  isEmployBoardSourceUrl,
  isEmploySubstituteSourcePostId,
} from "@balink/domain";
import { detectWorkingDetailState, fetchEucKrHtml, loginBalletmania } from "./balletmania-working.js";

const substitutePostRepository = new SubstitutePostRepository();
const DELETION_CHECK_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const MAX_DELETION_CHECKS = 10;

export async function refreshSubstituteLifecycle(limit = 50): Promise<{ expired: number; deleted: number }> {
  const openPosts = await substitutePostRepository.findOpenPostsNeedingLifecycleCheck(limit);
  let expired = 0;
  let deleted = 0;
  const now = new Date();

  for (const post of openPosts) {
    const status = deriveSubstituteStatus({ expiresAt: post.expiresAt, now });
    if (status === "EXPIRED") {
      await substitutePostRepository.updateStatus(post.id, "EXPIRED");
      expired += 1;
    }
  }

  const deletionCandidates = openPosts
    .filter((post) => {
      // 채용 보드에서 라우팅된 대강은 working HTML 파서로 삭제 판정하면 안 됨
      if (isEmploySubstituteSourcePostId(post.sourcePostId) || isEmployBoardSourceUrl(post.sourceUrl)) {
        return false;
      }
      if (!post.nextLessonAt) return false;
      if (post.nextLessonAt.getTime() > now.getTime() + 48 * 60 * 60 * 1000) return false;
      if (post.lastDeletionCheckAt && now.getTime() - post.lastDeletionCheckAt.getTime() < DELETION_CHECK_COOLDOWN_MS) {
        return false;
      }
      return true;
    })
    .slice(0, MAX_DELETION_CHECKS);

  if (deletionCandidates.length > 0) {
    const cookie = await loginBalletmania();
    for (const post of deletionCandidates) {
      const html = await fetchEucKrHtml(post.sourceUrl, cookie);
      const state = detectWorkingDetailState(html);
      await substitutePostRepository.markDeletionChecked(post.id, now);
      if (state === "deleted" || state === "missing") {
        await substitutePostRepository.updateStatus(post.id, "DELETED");
        deleted += 1;
      }
    }
  }

  return { expired, deleted };
}
