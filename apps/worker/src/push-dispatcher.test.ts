import assert from "node:assert/strict";
import test from "node:test";
import type { ExpoPushReceipt, ExpoPushTicket } from "expo-server-sdk";
import {
  buildExpoPushMessage,
  classifyPushReceipt,
  classifyPushTicket,
  nextAttemptAt,
} from "./push-dispatcher.js";

test("buildExpoPushMessage includes safe navigation payload", () => {
  const message = buildExpoPushMessage(
    {
      pushMessage: {
        id: "message-1",
        userNotificationId: "notification-1",
        kind: "job_match",
        title: "새 공고",
        body: "성북구 · 월수금",
        href: "/jobs/job-1",
      },
    },
    "ExpoPushToken[test-token]",
  );
  assert.equal(message.to, "ExpoPushToken[test-token]");
  assert.deepEqual(message.data, {
    notificationId: "notification-1",
    type: "job_match",
    href: "/jobs/job-1",
  });
  assert.equal(message.channelId, "match");
});

test("Expo ticket mock maps success, retry, permanent failure and token disable", () => {
  const tickets: Array<ExpoPushTicket | undefined> = [
    { status: "ok", id: "ticket-1" },
    {
      status: "error",
      message: "gone",
      details: { error: "DeviceNotRegistered" },
    },
    {
      status: "error",
      message: "large",
      details: { error: "MessageTooBig" },
    },
    {
      status: "error",
      message: "busy",
      details: { error: "MessageRateExceeded" },
    },
    undefined,
  ];
  assert.equal(classifyPushTicket(tickets[0]).action, "ticketed");
  assert.equal(classifyPushTicket(tickets[1]).action, "disable");
  assert.equal(classifyPushTicket(tickets[2]).action, "failed");
  assert.equal(classifyPushTicket(tickets[3]).action, "retry");
  assert.equal(classifyPushTicket(tickets[4]).action, "retry");
});

test("Expo receipt mock marks DeviceNotRegistered for token disable", () => {
  const ok: ExpoPushReceipt = { status: "ok" };
  const gone: ExpoPushReceipt = {
    status: "error",
    message: "device gone",
    details: { error: "DeviceNotRegistered" },
  };
  assert.deepEqual(classifyPushReceipt(ok), { action: "delivered" });
  assert.equal(classifyPushReceipt(gone).action, "disable");
});

test("retry backoff grows exponentially and caps at 30 minutes", () => {
  const now = Date.parse("2026-08-11T00:00:00Z");
  assert.equal(nextAttemptAt(1, now).getTime() - now, 30_000);
  assert.equal(nextAttemptAt(2, now).getTime() - now, 60_000);
  assert.equal(nextAttemptAt(99, now).getTime() - now, 30 * 60_000);
});
