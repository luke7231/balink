CREATE TYPE "PushPlatform" AS ENUM ('ios', 'android');
CREATE TYPE "PushPermissionStatus" AS ENUM ('granted', 'denied', 'undetermined', 'unavailable');
CREATE TYPE "PushDeliveryStatus" AS ENUM ('pending', 'processing', 'ticketed', 'delivered', 'retrying', 'failed');
CREATE TYPE "PushReceiptStatus" AS ENUM ('pending', 'ok', 'error');

CREATE TABLE "PushDevice" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "expoPushToken" TEXT,
  "installationId" TEXT NOT NULL,
  "installationSecretHash" TEXT NOT NULL,
  "platform" "PushPlatform" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "permissionStatus" "PushPermissionStatus" NOT NULL DEFAULT 'undetermined',
  "canAskAgain" BOOLEAN NOT NULL DEFAULT true,
  "permissionUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PushDevice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushMessage" (
  "id" TEXT NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "userNotificationId" TEXT,
  "kind" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "href" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PushMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushDelivery" (
  "id" TEXT NOT NULL,
  "pushMessageId" TEXT NOT NULL,
  "pushDeviceId" TEXT NOT NULL,
  "status" "PushDeliveryStatus" NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "claimedAt" TIMESTAMP(3),
  "expoTicketId" TEXT,
  "receiptStatus" "PushReceiptStatus",
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PushDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushDevice_expoPushToken_key" ON "PushDevice"("expoPushToken");
CREATE UNIQUE INDEX "PushDevice_installationId_key" ON "PushDevice"("installationId");
CREATE INDEX "PushDevice_userId_enabled_permissionStatus_idx" ON "PushDevice"("userId", "enabled", "permissionStatus");
CREATE INDEX "PushDevice_enabled_permissionStatus_idx" ON "PushDevice"("enabled", "permissionStatus");
CREATE UNIQUE INDEX "PushMessage_dedupeKey_key" ON "PushMessage"("dedupeKey");
CREATE UNIQUE INDEX "PushMessage_userNotificationId_key" ON "PushMessage"("userNotificationId");
CREATE UNIQUE INDEX "PushDelivery_expoTicketId_key" ON "PushDelivery"("expoTicketId");
CREATE UNIQUE INDEX "PushDelivery_pushMessageId_pushDeviceId_key" ON "PushDelivery"("pushMessageId", "pushDeviceId");
CREATE INDEX "PushDelivery_status_nextAttemptAt_idx" ON "PushDelivery"("status", "nextAttemptAt");
CREATE INDEX "PushDelivery_receiptStatus_sentAt_idx" ON "PushDelivery"("receiptStatus", "sentAt");

ALTER TABLE "PushDevice"
  ADD CONSTRAINT "PushDevice_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PushMessage"
  ADD CONSTRAINT "PushMessage_userNotificationId_fkey"
  FOREIGN KEY ("userNotificationId") REFERENCES "UserNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PushDelivery"
  ADD CONSTRAINT "PushDelivery_pushMessageId_fkey"
  FOREIGN KEY ("pushMessageId") REFERENCES "PushMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PushDelivery"
  ADD CONSTRAINT "PushDelivery_pushDeviceId_fkey"
  FOREIGN KEY ("pushDeviceId") REFERENCES "PushDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
