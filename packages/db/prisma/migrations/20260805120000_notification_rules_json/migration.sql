-- AlterTable
ALTER TABLE "UserNotificationPreference" ADD COLUMN "rulesJson" JSONB NOT NULL DEFAULT '[]';

-- AlterTable: keep legacy columns with defaults for older rows / writers
ALTER TABLE "UserNotificationPreference" ALTER COLUMN "regularJson" SET DEFAULT '{}';
ALTER TABLE "UserNotificationPreference" ALTER COLUMN "substituteJson" SET DEFAULT '{}';
