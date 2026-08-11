import { PushOutboxRepository, prisma } from "@balink/db";
import { runPushDispatchTick } from "./push-dispatcher.js";

const userId = readArgument("--user-id");
if (!userId) {
  console.error("사용법: pnpm --filter @balink/worker push:test -- --user-id <USER_ID>");
  process.exitCode = 1;
} else {
  try {
    await sendTestPush(userId);
  } finally {
    await prisma.$disconnect();
  }
}

async function sendTestPush(targetUserId: string) {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });
  if (!user) throw new Error("존재하지 않는 사용자입니다.");

  const activeDeviceCount = await prisma.pushDevice.count({
    where: {
      userId: targetUserId,
      enabled: true,
      permissionStatus: "granted",
      expoPushToken: { not: null },
    },
  });
  if (activeDeviceCount === 0) {
    throw new Error("이 사용자에게 등록된 활성 푸시 디바이스가 없습니다.");
  }

  const notification = await prisma.userNotification.create({
    data: {
      userId: targetUserId,
      type: "system",
      title: "🩰 발링크 테스트 알림",
      body: "실제 단말 푸시 연결이 정상입니다.",
      href: "/notifications",
    },
  });
  const outbox = new PushOutboxRepository();
  const enqueued = await outbox.enqueueUserNotifications([notification.id]);
  const dispatched = await runPushDispatchTick();
  console.info(
    `[push:test] userId=${targetUserId} devices=${activeDeviceCount} enqueued=${enqueued.deliveries} dispatched=${dispatched}`,
  );
}

function readArgument(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

