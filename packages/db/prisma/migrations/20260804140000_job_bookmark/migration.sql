-- CreateTable
CREATE TABLE "JobBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobPostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobBookmark_userId_createdAt_idx" ON "JobBookmark"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "JobBookmark_jobPostId_idx" ON "JobBookmark"("jobPostId");

-- CreateIndex
CREATE UNIQUE INDEX "JobBookmark_userId_jobPostId_key" ON "JobBookmark"("userId", "jobPostId");

-- AddForeignKey
ALTER TABLE "JobBookmark" ADD CONSTRAINT "JobBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobBookmark" ADD CONSTRAINT "JobBookmark_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
