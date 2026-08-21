-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- CreateEnum
CREATE TYPE "EmailAuthPurpose" AS ENUM ('signup', 'reset');

-- CreateTable
CREATE TABLE "EmailAuthChallenge" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "purpose" "EmailAuthPurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailAuthChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthThrottle" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthThrottle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailAuthChallenge_email_purpose_createdAt_idx" ON "EmailAuthChallenge"("email", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "EmailAuthChallenge_expiresAt_idx" ON "EmailAuthChallenge"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuthThrottle_key_key" ON "AuthThrottle"("key");

-- CreateIndex
CREATE INDEX "AuthThrottle_lockedUntil_idx" ON "AuthThrottle"("lockedUntil");
