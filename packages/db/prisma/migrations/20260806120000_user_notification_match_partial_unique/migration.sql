-- Match inbox dedupe: same user + same job/substitute only once.
-- Partial so system notifications (null FKs) are unaffected.
CREATE UNIQUE INDEX "UserNotification_userId_jobPostId_uidx"
ON "UserNotification" ("userId", "jobPostId")
WHERE "jobPostId" IS NOT NULL;

CREATE UNIQUE INDEX "UserNotification_userId_substitutePostId_uidx"
ON "UserNotification" ("userId", "substitutePostId")
WHERE "substitutePostId" IS NOT NULL;
