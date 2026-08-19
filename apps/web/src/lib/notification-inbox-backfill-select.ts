import {
  JOB_MATCH_NOTIFICATION_TITLE,
  SUBSTITUTE_MATCH_NOTIFICATION_TITLE,
  formatJobMatchNotificationBody,
  formatSubstituteMatchNotificationBody,
  isBlankNotificationPreference,
  matchesNotificationPreference,
  toJobMatchPreferenceInput,
  toSubstituteMatchPreferenceInput,
  type AlertJobType,
  type NotificationPreference,
} from "@balink/domain";

export const INBOX_BACKFILL_DAYS = 14;
export const INBOX_BACKFILL_LIMIT = 20;

export type InboxBackfillRow = {
  userId: string;
  type: "job_match" | "substitute_match";
  title: string;
  body: string;
  href: string;
  jobPostId?: string;
  substitutePostId?: string;
  createdAt?: Date;
};

export function regionsFromPreference(
  preference: NotificationPreference,
  jobType: AlertJobType,
): Array<{ sido: string; sigungu: string }> {
  const seen = new Set<string>();
  const regions: Array<{ sido: string; sigungu: string }> = [];
  for (const rule of preference.rules) {
    if (!rule.enabled || rule.jobType !== jobType) continue;
    const sido = rule.sido.trim();
    const sigungu = rule.sigungu.trim();
    if (!sido || !sigungu) continue;
    const key = `${sido}\0${sigungu}`;
    if (seen.has(key)) continue;
    seen.add(key);
    regions.push({ sido, sigungu });
  }
  return regions;
}

export function pickMatchingBackfillRows(
  userId: string,
  preference: NotificationPreference,
  jobs: Array<{
    id: string;
    sido?: string | null;
    sigungu?: string | null;
    days?: unknown;
    dayGroups?: unknown;
    timeSlots?: unknown;
    createdAt: Date;
  }>,
  substitutes: Array<{
    id: string;
    sido?: string | null;
    sigungu?: string | null;
    lessonDatesJson?: unknown;
    timeSlotsJson?: unknown;
    createdAt: Date;
  }>,
  limit = INBOX_BACKFILL_LIMIT,
): InboxBackfillRow[] {
  if (!preference.enabled || isBlankNotificationPreference(preference)) return [];

  const ranked: Array<InboxBackfillRow & { createdAt: Date }> = [];

  for (const job of jobs) {
    if (!matchesNotificationPreference(preference, toJobMatchPreferenceInput(job))) continue;
    ranked.push({
      userId,
      type: "job_match",
      title: JOB_MATCH_NOTIFICATION_TITLE,
      body: formatJobMatchNotificationBody(job),
      href: `/jobs/${job.id}`,
      jobPostId: job.id,
      createdAt: job.createdAt,
    });
  }

  for (const post of substitutes) {
    const input = toSubstituteMatchPreferenceInput({
      sido: post.sido,
      sigungu: post.sigungu,
      lessonDates: post.lessonDatesJson,
      timeSlots: post.timeSlotsJson,
    });
    if (!matchesNotificationPreference(preference, input)) continue;
    ranked.push({
      userId,
      type: "substitute_match",
      title: SUBSTITUTE_MATCH_NOTIFICATION_TITLE,
      body: formatSubstituteMatchNotificationBody({
        sigungu: post.sigungu,
        lessonDates: post.lessonDatesJson,
        timeSlots: post.timeSlotsJson,
      }),
      href: `/substitutes/${post.id}`,
      substitutePostId: post.id,
      createdAt: post.createdAt,
    });
  }

  return ranked
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, limit);
}
