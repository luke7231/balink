-- CreateTable
CREATE TABLE "SubstituteBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "substitutePostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubstituteBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubstituteBookmark_userId_createdAt_idx" ON "SubstituteBookmark"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SubstituteBookmark_substitutePostId_idx" ON "SubstituteBookmark"("substitutePostId");

-- CreateIndex
CREATE UNIQUE INDEX "SubstituteBookmark_userId_substitutePostId_key" ON "SubstituteBookmark"("userId", "substitutePostId");

-- AddForeignKey
ALTER TABLE "SubstituteBookmark" ADD CONSTRAINT "SubstituteBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstituteBookmark" ADD CONSTRAINT "SubstituteBookmark_substitutePostId_fkey" FOREIGN KEY ("substitutePostId") REFERENCES "SubstitutePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
