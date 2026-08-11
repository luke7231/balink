-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('ACADEMY', 'DISPATCH_AGENCY', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL DEFAULT 'UNKNOWN',
    "matchKey" TEXT NOT NULL,
    "sido" TEXT,
    "sigungu" TEXT,
    "dongOrStation" TEXT,
    "phonesJson" JSONB NOT NULL DEFAULT '[]',
    "emailsJson" JSONB NOT NULL DEFAULT '[]',
    "logoUrl" TEXT,
    "galleryJson" JSONB NOT NULL DEFAULT '[]',
    "externalProfileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "JobPost" ADD COLUMN "organizationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_matchKey_key" ON "Organization"("matchKey");

-- CreateIndex
CREATE INDEX "Organization_normalizedName_idx" ON "Organization"("normalizedName");

-- CreateIndex
CREATE INDEX "Organization_sido_sigungu_idx" ON "Organization"("sido", "sigungu");

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE INDEX "JobPost_organizationId_idx" ON "JobPost"("organizationId");

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
