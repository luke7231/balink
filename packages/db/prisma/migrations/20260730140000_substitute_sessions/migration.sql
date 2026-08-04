-- AlterTable
ALTER TABLE "SubstitutePost" ADD COLUMN "summary" TEXT;
ALTER TABLE "SubstitutePost" ADD COLUMN "sessionsJson" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "SubstitutePost" ADD COLUMN "recurrenceJson" JSONB;
ALTER TABLE "SubstitutePost" ADD COLUMN "scheduleKind" TEXT NOT NULL DEFAULT 'unscheduled';
ALTER TABLE "SubstitutePost" ADD COLUMN "representativePayJson" JSONB;
ALTER TABLE "SubstitutePost" ADD COLUMN "representativePayText" TEXT;
ALTER TABLE "SubstitutePost" ADD COLUMN "academyName" TEXT;
ALTER TABLE "SubstitutePost" ADD COLUMN "requirementsJson" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "SubstitutePost" ADD COLUMN "applicationInstructions" TEXT;
ALTER TABLE "SubstitutePost" ADD COLUMN "notesJson" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "SubstitutePost" ADD COLUMN "nextLessonAt" TIMESTAMP(3);
ALTER TABLE "SubstitutePost" ADD COLUMN "normalizationVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SubstitutePost" ADD COLUMN "normalizedAt" TIMESTAMP(3);
ALTER TABLE "SubstitutePost" ADD COLUMN "lastDeletionCheckAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "SubstitutePost_status_nextLessonAt_idx" ON "SubstitutePost"("status", "nextLessonAt");
