import { PushOutboxRepository, prisma } from "@balink/db";
import { formatSubstituteMatchNotificationBody } from "@balink/domain";
import { config } from "./config.js";

const outboxRepository = new PushOutboxRepository();

export interface AnonymousUrgentSubstitute {
  id: string;
  urgency?: string | null;
  sigungu?: string | null;
  lessonDatesJson?: unknown;
  timeSlotsJson?: unknown;
}

export async function enqueueAnonymousUrgentPush(
  post: AnonymousUrgentSubstitute,
): Promise<number> {
  if (!config.anonymousUrgentPushEnabled || post.urgency !== "same_day") return 0;
  const result = await outboxRepository.enqueuePublicMessage({
    dedupeKey: `anonymous:urgent-substitute:${post.id}`,
    kind: "anonymous_urgent_substitute",
    title: "⚡ 오늘 대강이 올라왔어요",
    body: formatSubstituteMatchNotificationBody({
      sigungu: post.sigungu,
      lessonDates: post.lessonDatesJson,
      timeSlots: post.timeSlotsJson,
    }),
    href: `/substitutes/${post.id}`,
  });
  return result.deliveries;
}

export async function enqueueAnonymousDailyDigest(now = new Date()): Promise<number> {
  if (!config.anonymousDailyDigestEnabled) return 0;
  const parts = kstDateParts(now);
  if (parts.hour !== config.anonymousDailyDigestHourKst) return 0;

  const start = new Date(`${parts.date}T00:00:00+09:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60_000);
  const count = await prisma.jobPost.count({
    where: {
      isBallet: true,
      createdAt: { gte: start, lt: end },
    },
  });
  if (count === 0) return 0;

  const result = await outboxRepository.enqueuePublicMessage({
    dedupeKey: `anonymous:daily-job-digest:${parts.date}`,
    kind: "anonymous_daily_job_digest",
    title: `📢 오늘 신규 채용 ${count}건`,
    body: "새로 올라온 발레 강사 채용 공고를 확인해 보세요.",
    href: "/",
  });
  return result.deliveries;
}

function kstDateParts(now: Date): { date: string; hour: number } {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now),
  );
  return { date, hour };
}
