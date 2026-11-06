ALTER TABLE "JobPost" ADD COLUMN "hiddenAt" TIMESTAMP(3), ADD COLUMN "hiddenReason" TEXT;
ALTER TABLE "SubstitutePost" ADD COLUMN "hiddenAt" TIMESTAMP(3), ADD COLUMN "hiddenReason" TEXT;
