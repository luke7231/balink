import {
  UserNotificationRepository,
  prisma,
  type MatchNotificationInsert,
} from "@black-swan/db";
import {
  JOB_MATCH_NOTIFICATION_TITLE,
  SUBSTITUTE_MATCH_NOTIFICATION_TITLE,
  formatJobMatchNotificationBody,
  formatSubstituteMatchNotificationBody,
  matchesNotificationPreference,
  parseNotificationPreference,
  toJobMatchPreferenceInput,
  toSubstituteMatchPreferenceInput,
} from "@black-swan/domain";

const userNotificationRepository = new UserNotificationRepository();

export interface JobMatchFanOutTarget {
  id: string;
  sido?: string | null;
  sigungu?: string | null;
  days?: unknown;
  dayGroups?: unknown;
  timeSlots?: unknown;
}

export interface SubstituteMatchFanOutTarget {
  id: string;
  sido?: string | null;
  sigungu?: string | null;
  lessonDatesJson?: unknown;
  timeSlotsJson?: unknown;
}

export interface FanOutSummary {
  matched: number;
  inserted: number;
  skippedReason?: "no_region";
}

/** created && fanOutInbox 일 때만 호출 측에서 진입 */
export async function fanOutJobMatch(jobPost: JobMatchFanOutTarget): Promise<FanOutSummary> {
  const matchInput = toJobMatchPreferenceInput(jobPost);
  if (!matchInput.sido || !matchInput.sigungu) {
    console.info(`[notification-fanout] skipped: no_region jobPostId=${jobPost.id}`);
    return { matched: 0, inserted: 0, skippedReason: "no_region" };
  }

  const title = JOB_MATCH_NOTIFICATION_TITLE;
  const body = formatJobMatchNotificationBody(jobPost);
  const href = `/jobs/${jobPost.id}`;
  const rows = await collectMatchingRows(matchInput, (userId) => ({
    userId,
    type: "job_match",
    title,
    body,
    href,
    jobPostId: jobPost.id,
  }));

  const result = await userNotificationRepository.createManyForMatch(rows);
  return { matched: rows.length, inserted: result.count };
}

export async function fanOutSubstituteMatch(
  post: SubstituteMatchFanOutTarget,
): Promise<FanOutSummary> {
  const matchInput = toSubstituteMatchPreferenceInput({
    sido: post.sido,
    sigungu: post.sigungu,
    lessonDates: post.lessonDatesJson,
    timeSlots: post.timeSlotsJson,
  });
  if (!matchInput.sido || !matchInput.sigungu) {
    console.info(`[notification-fanout] skipped: no_region substitutePostId=${post.id}`);
    return { matched: 0, inserted: 0, skippedReason: "no_region" };
  }

  const title = SUBSTITUTE_MATCH_NOTIFICATION_TITLE;
  const body = formatSubstituteMatchNotificationBody({
    sigungu: post.sigungu,
    lessonDates: post.lessonDatesJson,
    timeSlots: post.timeSlotsJson,
  });
  const href = `/substitutes/${post.id}`;
  const rows = await collectMatchingRows(matchInput, (userId) => ({
    userId,
    type: "substitute_match",
    title,
    body,
    href,
    substitutePostId: post.id,
  }));

  const result = await userNotificationRepository.createManyForMatch(rows);
  return { matched: rows.length, inserted: result.count };
}

async function collectMatchingRows(
  matchInput: Parameters<typeof matchesNotificationPreference>[1],
  toRow: (userId: string) => MatchNotificationInsert,
): Promise<MatchNotificationInsert[]> {
  const preferences = await prisma.userNotificationPreference.findMany({
    where: { enabled: true },
    select: {
      userId: true,
      enabled: true,
      rulesJson: true,
      regularJson: true,
      substituteJson: true,
    },
  });

  const rows: MatchNotificationInsert[] = [];
  for (const row of preferences) {
    const preference = parseNotificationPreference(row);
    if (!matchesNotificationPreference(preference, matchInput)) continue;
    rows.push(toRow(row.userId));
  }
  return rows;
}

/** 테스트용: create + fanOutInbox 게이트 */
export function shouldFanOutInbox(input: {
  created: boolean;
  fanOutInbox?: boolean;
}): boolean {
  return input.created === true && input.fanOutInbox === true;
}
