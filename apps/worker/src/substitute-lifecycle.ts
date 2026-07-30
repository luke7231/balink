import { SubstitutePostRepository } from "@black-swan/db";
import { fetchEucKrHtml, loginBalletmania, parseWorkingDetail } from "./balletmania-working.js";

const substitutePostRepository = new SubstitutePostRepository();

export async function refreshSubstituteLifecycle(limit = 50): Promise<{ expired: number; deleted: number }> {
  const openPosts = await substitutePostRepository.findOpenPostsNeedingLifecycleCheck(limit);
  let expired = 0;
  let deleted = 0;
  const today = todayKstDate();

  for (const post of openPosts) {
    const lessonDates = parseLessonDates(post.lessonDatesJson);
    if (lessonDates.length > 0 && lessonDates.every((date) => date < today)) {
      await substitutePostRepository.updateStatus(post.id, "EXPIRED");
      expired += 1;
      continue;
    }

    if (post.expiresAt && post.expiresAt < new Date()) {
      await substitutePostRepository.updateStatus(post.id, "EXPIRED");
      expired += 1;
    }
  }

  if (openPosts.length > 0) {
    const cookie = await loginBalletmania();
    for (const post of openPosts.slice(0, 10)) {
      const html = await fetchEucKrHtml(post.sourceUrl, cookie);
      const detail = parseWorkingDetail(html);
      if (detail.state === "deleted" || detail.state === "missing") {
        await substitutePostRepository.updateStatus(post.id, "DELETED");
        deleted += 1;
      }
    }
  }

  return { expired, deleted };
}

function parseLessonDates(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function todayKstDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
