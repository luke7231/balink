import {
  PushDeviceRepository,
  PushOutboxRepository,
} from "@balink/db";
import Expo, {
  type ExpoPushMessage,
  type ExpoPushReceipt,
  type ExpoPushTicket,
} from "expo-server-sdk";
import { config } from "./config.js";

const outboxRepository = new PushOutboxRepository();
const deviceRepository = new PushDeviceRepository();
const expo = new Expo(
  config.expoAccessToken ? { accessToken: config.expoAccessToken } : undefined,
);
let dispatchRunning = false;
let receiptRunning = false;

export interface ExpoPushClient {
  sendPushNotificationsAsync(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]>;
  getPushNotificationReceiptsAsync(ids: string[]): Promise<Record<string, ExpoPushReceipt>>;
  chunkPushNotifications(messages: ExpoPushMessage[]): ExpoPushMessage[][];
  chunkPushNotificationReceiptIds(ids: string[]): string[][];
}

export async function runPushDispatchTick(client: ExpoPushClient = expo): Promise<number> {
  if (!config.pushDispatchEnabled || dispatchRunning) return 0;
  if (!config.expoAccessToken) {
    console.error("[push-dispatcher] EXPO_ACCESS_TOKEN is required");
    return 0;
  }

  dispatchRunning = true;
  try {
    const deliveries = await outboxRepository.claimPendingDeliveries(config.pushDispatchBatchSize);
    if (deliveries.length === 0) return 0;

    const sendable: Array<{
      delivery: (typeof deliveries)[number];
      message: ExpoPushMessage;
    }> = [];
    for (const delivery of deliveries) {
      const notification = delivery.pushMessage.userNotification;
      const ownershipChanged = notification
        ? delivery.pushDevice.userId !== notification.userId
        : delivery.pushDevice.userId !== null;
      if (
        !delivery.pushDevice.enabled ||
        delivery.pushDevice.permissionStatus !== "granted" ||
        ownershipChanged
      ) {
        await outboxRepository.markFailed(delivery.id, "Push device is no longer eligible");
        continue;
      }
      const token = delivery.pushDevice.expoPushToken;
      if (!Expo.isExpoPushToken(token)) {
        await Promise.all([
          outboxRepository.markFailed(delivery.id, "Invalid Expo push token"),
          deviceRepository.disableByIds([delivery.pushDeviceId]),
        ]);
        continue;
      }
      sendable.push({
        delivery,
        message: buildExpoPushMessage(delivery, token),
      });
    }

    let offset = 0;
    for (const chunk of client.chunkPushNotifications(sendable.map((item) => item.message))) {
      const chunkEntries = sendable.slice(offset, offset + chunk.length);
      offset += chunk.length;
      try {
        const tickets = await client.sendPushNotificationsAsync(chunk);
        await Promise.all(
          chunkEntries.map((entry, index) =>
            processTicket(entry.delivery, tickets[index]),
          ),
        );
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        await Promise.all(
          chunkEntries.map(({ delivery }) =>
            outboxRepository.markRetry(
              delivery.id,
              detail,
              nextAttemptAt(delivery.attempts),
              config.pushMaxAttempts,
            ),
          ),
        );
      }
    }
    return sendable.length;
  } finally {
    dispatchRunning = false;
  }
}

export async function runPushReceiptTick(client: ExpoPushClient = expo): Promise<number> {
  if (!config.pushDispatchEnabled || receiptRunning) return 0;
  if (!config.expoAccessToken) return 0;

  receiptRunning = true;
  try {
    const deliveries = await outboxRepository.listPendingReceipts(config.pushReceiptBatchSize);
    const byTicketId = new Map(
      deliveries.flatMap((delivery) =>
        delivery.expoTicketId ? [[delivery.expoTicketId, delivery] as const] : [],
      ),
    );
    for (const ids of client.chunkPushNotificationReceiptIds([...byTicketId.keys()])) {
      let receipts: Record<string, ExpoPushReceipt>;
      try {
        receipts = await client.getPushNotificationReceiptsAsync(ids);
      } catch (error) {
        console.error("[push-dispatcher] receipt request failed", error);
        continue;
      }
      await Promise.all(
        Object.entries(receipts).map(async ([ticketId, receipt]) => {
          const delivery = byTicketId.get(ticketId);
          if (!delivery) return;
          const decision = classifyPushReceipt(receipt);
          if (decision.action === "delivered") {
            await outboxRepository.markReceiptDelivered(delivery.id);
            return;
          }
          if (decision.action === "disable") {
            await deviceRepository.disableByIds([delivery.pushDeviceId]);
          } else if (decision.code === "InvalidCredentials") {
            console.error("[push-dispatcher] Expo receipt InvalidCredentials", decision.error);
          }
          await outboxRepository.markReceiptError(
            delivery.id,
            decision.error,
          );
        }),
      );
    }
    return deliveries.length;
  } finally {
    receiptRunning = false;
  }
}

async function processTicket(
  delivery: Awaited<ReturnType<PushOutboxRepository["claimPendingDeliveries"]>>[number],
  ticket: ExpoPushTicket | undefined,
) {
  const decision = classifyPushTicket(ticket);
  if (decision.action === "retry") {
    await outboxRepository.markRetry(
      delivery.id,
      decision.error,
      nextAttemptAt(delivery.attempts),
      config.pushMaxAttempts,
    );
    return;
  }
  if (decision.action === "ticketed") {
    await outboxRepository.markTicketed(delivery.id, decision.ticketId);
    return;
  }
  if (decision.action === "disable") {
    await Promise.all([
      outboxRepository.markFailed(delivery.id, decision.error),
      deviceRepository.disableByIds([delivery.pushDeviceId]),
    ]);
  } else {
    if (decision.code === "InvalidCredentials") {
      console.error("[push-dispatcher] Expo ticket InvalidCredentials", decision.error);
    }
    await outboxRepository.markFailed(delivery.id, decision.error);
  }
}

export function buildExpoPushMessage(
  delivery: {
    pushMessage: {
      id: string;
      userNotificationId: string | null;
      kind: string;
      title: string;
      body: string;
      href: string | null;
    };
  },
  token: string,
): ExpoPushMessage {
  return {
    to: token,
    title: delivery.pushMessage.title,
    body: delivery.pushMessage.body,
    sound: "default",
    priority: "high",
    channelId: "match",
    data: {
      notificationId:
        delivery.pushMessage.userNotificationId ?? delivery.pushMessage.id,
      type: delivery.pushMessage.kind,
      href: delivery.pushMessage.href,
    },
  };
}

export type PushTicketDecision =
  | { action: "ticketed"; ticketId: string }
  | { action: "retry" | "failed" | "disable"; error: string; code?: string };

export function classifyPushTicket(ticket: ExpoPushTicket | undefined): PushTicketDecision {
  if (!ticket) return { action: "retry", error: "Expo ticket missing" };
  if (ticket.status === "ok") return { action: "ticketed", ticketId: ticket.id };
  const code = ticket.details?.error;
  const error = formatExpoError(code, ticket.message);
  if (code === "DeviceNotRegistered") return { action: "disable", code, error };
  if (code === "MessageTooBig" || code === "InvalidCredentials") {
    return { action: "failed", code, error };
  }
  return { action: "retry", code, error };
}

export type PushReceiptDecision =
  | { action: "delivered" }
  | { action: "failed" | "disable"; error: string; code?: string };

export function classifyPushReceipt(receipt: ExpoPushReceipt): PushReceiptDecision {
  if (receipt.status === "ok") return { action: "delivered" };
  const code = receipt.details?.error;
  const error = formatExpoError(code, receipt.message);
  return {
    action: code === "DeviceNotRegistered" ? "disable" : "failed",
    code,
    error,
  };
}

export function nextAttemptAt(attempts: number, now = Date.now()): Date {
  const delayMs = Math.min(30 * 60_000, 30_000 * 2 ** Math.max(0, attempts - 1));
  return new Date(now + delayMs);
}

function formatExpoError(code: string | undefined, message: string): string {
  return code ? `${code}: ${message}` : message;
}
