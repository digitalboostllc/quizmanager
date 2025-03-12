/*
  Warnings:

  - A unique constraint covering the columns `[scheduledAt]` on the table `ScheduledPost` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ScheduledPost_quizId_key";

-- DropIndex
DROP INDEX "ScheduledPost_scheduledAt_idx";

-- CreateIndex
CREATE INDEX "ScheduledPost_quizId_idx" ON "ScheduledPost"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledPost_scheduledAt_key" ON "ScheduledPost"("scheduledAt");
