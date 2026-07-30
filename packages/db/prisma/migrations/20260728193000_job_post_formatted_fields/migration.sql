-- AlterTable
ALTER TABLE "JobPost" ADD COLUMN "displaySectionsJson" JSONB;
ALTER TABLE "JobPost" ADD COLUMN "representativePayUnit" TEXT;
ALTER TABLE "JobPost" ADD COLUMN "representativePayText" TEXT;
ALTER TABLE "JobPost" ADD COLUMN "representativePayMinManwon" DOUBLE PRECISION;
ALTER TABLE "JobPost" ADD COLUMN "representativePayMaxManwon" DOUBLE PRECISION;
ALTER TABLE "JobPost" ADD COLUMN "representativePayJson" JSONB;
ALTER TABLE "JobPost" ADD COLUMN "locationSource" TEXT;
