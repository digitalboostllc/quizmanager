/*
  Warnings:

  - A unique constraint covering the columns `[quizId,scheduledAt]` on the table `ScheduledPost` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ScheduledPost_scheduledAt_key";

-- CreateIndex
CREATE INDEX "ScheduledPost_scheduledAt_idx" ON "ScheduledPost"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledPost_quizId_scheduledAt_key" ON "ScheduledPost"("quizId", "scheduledAt");
