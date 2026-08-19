import { prisma, UserNotificationRepository } from "@balink/db";
import { isBlankNotificationPreference, type NotificationPreference } from "@balink/domain";
import {
  INBOX_BACKFILL_DAYS,
  INBOX_BACKFILL_LIMIT,
  pickMatchingBackfillRows,
  regionsFromPreference,
} from "./notification-inbox-backfill-select";

export {
  INBOX_BACKFILL_DAYS,
  INBOX_BACKFILL_LIMIT,
  pickMatchingBackfillRows,
  regionsFromPreference,
} from "./notification-inbox-backfill-select";

const userNotificationRepository = new UserNotificationRepository();

export async function backfillInboxMatchesForUser(
  userId: string,
  preference: NotificationPreference,
): Promise<{ inserted: number }> {
  if (!preference.enabled || isBlankNotificationPreference(preference)) {
    return { inserted: 0 };
  }

  const since = new Date(Date.now() - INBOX_BACKFILL_DAYS * 24 * 60 * 60 * 1000);
  const fetchLimit = INBOX_BACKFILL_LIMIT * 3;
  const regularRegions = regionsFromPreference(preference, "regular");
  const substituteRegions = regionsFromPreference(preference, "substitute");

  const [jobs, substitutes] = await Promise.all([
    regularRegions.length === 0
      ? Promise.resolve([])
      : prisma.jobPost.findMany({
          where: {
            createdAt: { gte: since },
            OR: regularRegions,
          },
          select: {
            id: true,
            sido: true,
            sigungu: true,
            days: true,
            dayGroups: true,
            timeSlots: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: fetchLimit,
        }),
    substituteRegions.length === 0
      ? Promise.resolve([])
      : prisma.substitutePost.findMany({
          where: {
            status: "OPEN",
            createdAt: { gte: since },
            OR: substituteRegions,
          },
          select: {
            id: true,
            sido: true,
            sigungu: true,
            lessonDatesJson: true,
            timeSlotsJson: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: fetchLimit,
        }),
  ]);

  const rows = pickMatchingBackfillRows(userId, preference, jobs, substitutes);
  if (rows.length === 0) return { inserted: 0 };

  const result = await userNotificationRepository.createManyForMatch(rows);
  return { inserted: result.count };
}
