-- Add compound indexes for better query performance
-- These indexes improve the performance of cursor-based pagination and filtering

-- Template indexes
CREATE INDEX IF NOT EXISTS "Template_quizType_createdAt_idx" ON "Template" ("quizType", "createdAt");
CREATE INDEX IF NOT EXISTS "Template_quizType_name_idx" ON "Template" ("quizType", "name");

-- Quiz indexes
CREATE INDEX IF NOT EXISTS "Quiz_status_createdAt_idx" ON "Quiz" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Quiz_templateId_status_idx" ON "Quiz" ("templateId", "status");
CREATE INDEX IF NOT EXISTS "Quiz_language_createdAt_idx" ON "Quiz" ("language", "createdAt");

-- ScheduledPost indexes
CREATE INDEX IF NOT EXISTS "ScheduledPost_status_scheduledAt_idx" ON "ScheduledPost" ("status", "scheduledAt");
CREATE INDEX IF NOT EXISTS "ScheduledPost_quizId_status_idx" ON "ScheduledPost" ("quizId", "status");

-- AutoScheduleSlot indexes
CREATE INDEX IF NOT EXISTS "AutoScheduleSlot_isActive_dayOfWeek_idx" ON "AutoScheduleSlot" ("isActive", "dayOfWeek");

-- User indexes
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User" ("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User" ("role");

-- Session indexes
CREATE INDEX IF NOT EXISTS "Session_expires_idx" ON "Session" ("expires");

-- VerificationToken indexes
CREATE INDEX IF NOT EXISTS "VerificationToken_expires_idx" ON "VerificationToken" ("expires");

-- WordUsage indexes
CREATE INDEX IF NOT EXISTS "WordUsage_language_isUsed_idx" ON "WordUsage" ("language", "isUsed"); 