import type { PushPermissionStatus, PushPlatform } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "../client.js";

export interface PushInstallationInput {
  installationId: string;
  installationSecretHash: string;
  expoPushToken: string | null;
  platform: PushPlatform;
  permissionStatus: PushPermissionStatus;
  canAskAgain: boolean;
}

export class PushDeviceRepository {
  findByInstallationId(installationId: string) {
    return prisma.pushDevice.findUnique({ where: { installationId } });
  }

  findByExpoPushToken(expoPushToken: string) {
    return prisma.pushDevice.findUnique({ where: { expoPushToken } });
  }

  async upsertInstallation(input: PushInstallationInput) {
    return prisma.$transaction(async (tx) => {
      const enabled = input.permissionStatus === "granted" && Boolean(input.expoPushToken);
      return tx.pushDevice.upsert({
        where: { installationId: input.installationId },
        create: {
          ...input,
          enabled,
        },
        update: {
          expoPushToken: input.expoPushToken,
          platform: input.platform,
          permissionStatus: input.permissionStatus,
          canAskAgain: input.canAskAgain,
          permissionUpdatedAt: new Date(),
          lastSeenAt: new Date(),
          enabled,
        },
      });
    });
  }

  attachToUser(installationId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const device = await tx.pushDevice.findUniqueOrThrow({
        where: { installationId },
      });
      await tx.pushDelivery.updateMany({
        where: {
          pushDeviceId: device.id,
          status: { in: ["pending", "retrying", "processing"] },
          OR: [
            { pushMessage: { userNotificationId: null } },
            ...(device.userId && device.userId !== userId
              ? [{
                  pushMessage: {
                    userNotification: { is: { userId: device.userId } },
                  },
                }]
              : []),
          ],
        },
        data: {
          status: "failed",
          claimedAt: null,
          lastError: "device ownership changed",
        },
      });
      return tx.pushDevice.update({
        where: { installationId },
        data: { userId, lastSeenAt: new Date() },
      });
    });
  }

  detachFromUser(installationId: string, userId?: string) {
    return prisma.$transaction(async (tx) => {
      const device = await tx.pushDevice.findFirst({
        where: {
          installationId,
          ...(userId ? { userId } : {}),
        },
      });
      if (!device) return { count: 0 };
      if (device.userId) {
        await tx.pushDelivery.updateMany({
          where: {
            pushDeviceId: device.id,
            status: { in: ["pending", "retrying", "processing"] },
            pushMessage: {
              userNotification: { is: { userId: device.userId } },
            },
          },
          data: {
            status: "failed",
            claimedAt: null,
            lastError: "device detached",
          },
        });
      }
      await tx.pushDevice.update({
        where: { id: device.id },
        data: { userId: null, lastSeenAt: new Date() },
      });
      return { count: 1 };
    });
  }

  disableByIds(ids: string[]) {
    if (ids.length === 0) return Promise.resolve({ count: 0 });
    return prisma.pushDevice.updateMany({
      where: { id: { in: ids } },
      data: { enabled: false },
    });
  }

  listActiveForUser(userId: string) {
    return prisma.pushDevice.findMany({
      where: {
        userId,
        enabled: true,
        permissionStatus: "granted",
        expoPushToken: { not: null },
      },
    });
  }

  listActiveAnonymous() {
    return prisma.pushDevice.findMany({
      where: {
        userId: null,
        enabled: true,
        permissionStatus: "granted",
        expoPushToken: { not: null },
      },
    });
  }
}

export interface PublicPushMessageInput {
  dedupeKey: string;
  kind: string;
  title: string;
  body: string;
  href: string;
}

export class PushOutboxRepository {
  async enqueueUserNotifications(notificationIds: string[]) {
    if (notificationIds.length === 0) return { messages: 0, deliveries: 0 };
    return prisma.$transaction(async (tx) => {
      const notifications = await tx.userNotification.findMany({
        where: { id: { in: notificationIds } },
      });
      const userIds = [...new Set(notifications.map((notification) => notification.userId))];
      const devices = await tx.pushDevice.findMany({
        where: {
          userId: { in: userIds },
          enabled: true,
          permissionStatus: "granted",
          expoPushToken: { not: null },
        },
        select: { id: true, userId: true },
      });
      const deviceIdsByUser = new Map<string, string[]>();
      for (const device of devices) {
        const ids = deviceIdsByUser.get(device.userId ?? "") ?? [];
        ids.push(device.id);
        deviceIdsByUser.set(device.userId ?? "", ids);
      }

      let deliveryCount = 0;
      for (const notification of notifications) {
        const message = await tx.pushMessage.upsert({
          where: { dedupeKey: `user-notification:${notification.id}` },
          create: {
            dedupeKey: `user-notification:${notification.id}`,
            userNotificationId: notification.id,
            kind: notification.type,
            title: notification.title,
            body: notification.body,
            href: notification.href,
          },
          update: {
            title: notification.title,
            body: notification.body,
            href: notification.href,
          },
        });
        const deviceIds = deviceIdsByUser.get(notification.userId) ?? [];
        if (deviceIds.length === 0) continue;
        const result = await tx.pushDelivery.createMany({
          data: deviceIds.map((pushDeviceId) => ({
            pushMessageId: message.id,
            pushDeviceId,
          })),
          skipDuplicates: true,
        });
        deliveryCount += result.count;
      }
      return { messages: notifications.length, deliveries: deliveryCount };
    });
  }

  async enqueuePublicMessage(input: PublicPushMessageInput) {
    return prisma.$transaction(async (tx) => {
      const message = await tx.pushMessage.upsert({
        where: { dedupeKey: input.dedupeKey },
        create: input,
        update: {
          title: input.title,
          body: input.body,
          href: input.href,
        },
      });
      const devices = await tx.pushDevice.findMany({
        where: {
          userId: null,
          enabled: true,
          permissionStatus: "granted",
          expoPushToken: { not: null },
        },
        select: { id: true },
      });
      if (devices.length === 0) {
        return { messageId: message.id, deliveries: 0 };
      }
      const result = await tx.pushDelivery.createMany({
        data: devices.map((device) => ({
          pushMessageId: message.id,
          pushDeviceId: device.id,
        })),
        skipDuplicates: true,
      });
      return { messageId: message.id, deliveries: result.count };
    });
  }

  async claimPendingDeliveries(limit: number) {
    return prisma.$transaction(async (tx) => {
      await tx.pushDelivery.updateMany({
        where: {
          status: "processing",
          claimedAt: { lt: new Date(Date.now() - 5 * 60_000) },
        },
        data: {
          status: "retrying",
          claimedAt: null,
          nextAttemptAt: new Date(),
          lastError: "stale claim recovered",
        },
      });
      const claimed = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        UPDATE "PushDelivery"
        SET
          "status" = 'processing'::"PushDeliveryStatus",
          "attempts" = "attempts" + 1,
          "claimedAt" = NOW(),
          "updatedAt" = NOW()
        WHERE "id" IN (
          SELECT "id"
          FROM "PushDelivery"
          WHERE "status" IN (
            'pending'::"PushDeliveryStatus",
            'retrying'::"PushDeliveryStatus"
          )
          AND "nextAttemptAt" <= NOW()
          ORDER BY "nextAttemptAt" ASC, "createdAt" ASC
          FOR UPDATE SKIP LOCKED
          LIMIT ${limit}
        )
        RETURNING "id"
      `);
      if (claimed.length === 0) return [];
      return tx.pushDelivery.findMany({
        where: { id: { in: claimed.map((row) => row.id) } },
        include: {
          pushMessage: { include: { userNotification: true } },
          pushDevice: true,
        },
      });
    });
  }

  markTicketed(deliveryId: string, expoTicketId: string) {
    return prisma.pushDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "ticketed",
        expoTicketId,
        receiptStatus: "pending",
        sentAt: new Date(),
        claimedAt: null,
        lastError: null,
      },
    });
  }

  markRetry(deliveryId: string, error: string, nextAttemptAt: Date, maxAttempts: number) {
    return prisma.$transaction(async (tx) => {
      const delivery = await tx.pushDelivery.findUniqueOrThrow({
        where: { id: deliveryId },
        select: { attempts: true },
      });
      return tx.pushDelivery.update({
        where: { id: deliveryId },
        data: {
          status: delivery.attempts >= maxAttempts ? "failed" : "retrying",
          nextAttemptAt,
          claimedAt: null,
          lastError: error,
        },
      });
    });
  }

  markFailed(deliveryId: string, error: string) {
    return prisma.pushDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "failed",
        claimedAt: null,
        lastError: error,
      },
    });
  }

  listPendingReceipts(limit: number) {
    return prisma.pushDelivery.findMany({
      where: {
        status: "ticketed",
        receiptStatus: "pending",
        expoTicketId: { not: null },
      },
      orderBy: { sentAt: "asc" },
      take: limit,
      include: { pushDevice: true },
    });
  }

  markReceiptDelivered(deliveryId: string) {
    return prisma.pushDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "delivered",
        receiptStatus: "ok",
        deliveredAt: new Date(),
        lastError: null,
      },
    });
  }

  markReceiptError(deliveryId: string, error: string) {
    return prisma.pushDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "failed",
        receiptStatus: "error",
        lastError: error,
      },
    });
  }
}
