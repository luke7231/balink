-- CreateTable
CREATE TABLE "UserInterestRegion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sido" TEXT NOT NULL,
    "sigungu" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInterestRegion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserInterestRegion_userId_idx" ON "UserInterestRegion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInterestRegion_userId_sido_sigungu_key" ON "UserInterestRegion"("userId", "sido", "sigungu");

-- AddForeignKey
ALTER TABLE "UserInterestRegion" ADD CONSTRAINT "UserInterestRegion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
