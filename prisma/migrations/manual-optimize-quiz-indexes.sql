-- Add missing indexes for Quiz model to improve query performance
CREATE INDEX IF NOT EXISTS "Quiz_title_idx" ON "Quiz"("title");
CREATE INDEX IF NOT EXISTS "Quiz_status_idx" ON "Quiz"("status");
CREATE INDEX IF NOT EXISTS "Quiz_createdAt_idx" ON "Quiz"("createdAt");
CREATE INDEX IF NOT EXISTS "Quiz_templateId_idx" ON "Quiz"("templateId");

-- Optional: Add comment explaining the purpose of these indexes
COMMENT ON INDEX "Quiz_title_idx" IS 'Optimize search queries by title';
COMMENT ON INDEX "Quiz_status_idx" IS 'Optimize filtering by status';
COMMENT ON INDEX "Quiz_createdAt_idx" IS 'Optimize sorting by creation date';
COMMENT ON INDEX "Quiz_templateId_idx" IS 'Optimize joins with Template table'; 