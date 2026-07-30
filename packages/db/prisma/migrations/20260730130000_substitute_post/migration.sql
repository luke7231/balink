-- CreateEnum
CREATE TYPE "SubstitutePostStatus" AS ENUM ('OPEN', 'EXPIRED', 'DELETED');

-- CreateTable
CREATE TABLE "SubstitutePost" (
    "id" TEXT NOT NULL,
    "source" "SourceName" NOT NULL,
    "sourcePostId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "author" TEXT,
    "authorMemberNo" TEXT,
    "postedAt" TIMESTAMP(3),
    "lessonDatesJson" JSONB NOT NULL,
    "timeSlotsJson" JSONB NOT NULL,
    "audienceTypes" JSONB NOT NULL,
    "subjectTypes" JSONB NOT NULL,
    "locationText" TEXT,
    "sido" TEXT,
    "sigungu" TEXT,
    "dongOrStation" TEXT,
    "payText" TEXT,
    "contactMethodsJson" JSONB NOT NULL,
    "contactEmailsJson" JSONB NOT NULL,
    "contactPhonesJson" JSONB NOT NULL,
    "urgency" TEXT,
    "status" "SubstitutePostStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3),
    "recommendCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "rawJson" JSONB NOT NULL,
    "classificationJson" JSONB,
    "contentHash" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubstitutePost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubstitutePost_source_sourcePostId_key" ON "SubstitutePost"("source", "sourcePostId");

-- CreateIndex
CREATE INDEX "SubstitutePost_status_postedAt_idx" ON "SubstitutePost"("status", "postedAt");

-- CreateIndex
CREATE INDEX "SubstitutePost_status_expiresAt_idx" ON "SubstitutePost"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "SubstitutePost_contentHash_idx" ON "SubstitutePost"("contentHash");
