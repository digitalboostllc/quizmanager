-- Add missing compound indexes for Template
CREATE INDEX IF NOT EXISTS "Template_quizType_createdAt_idx" ON "Template"("quizType", "createdAt");
CREATE INDEX IF NOT EXISTS "Template_quizType_name_idx" ON "Template"("quizType", "name");

-- Add missing compound indexes for Quiz
CREATE INDEX IF NOT EXISTS "Quiz_status_createdAt_idx" ON "Quiz"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Quiz_templateId_status_idx" ON "Quiz"("templateId", "status");
CREATE INDEX IF NOT EXISTS "Quiz_language_createdAt_idx" ON "Quiz"("language", "createdAt");

-- Add missing compound indexes for ScheduledPost
CREATE INDEX IF NOT EXISTS "ScheduledPost_status_scheduledAt_idx" ON "ScheduledPost"("status", "scheduledAt");
CREATE INDEX IF NOT EXISTS "ScheduledPost_quizId_status_idx" ON "ScheduledPost"("quizId", "status");

-- Add missing compound indexes for AutoScheduleSlot
CREATE INDEX IF NOT EXISTS "AutoScheduleSlot_isActive_dayOfWeek_idx" ON "AutoScheduleSlot"("isActive", "dayOfWeek");

-- Add missing indexes for User
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- Add missing indexes for Session and VerificationToken
CREATE INDEX IF NOT EXISTS "Session_expires_idx" ON "Session"("expires");
CREATE INDEX IF NOT EXISTS "VerificationToken_expires_idx" ON "VerificationToken"("expires");

-- Add missing compound indexes for WordUsage
CREATE INDEX IF NOT EXISTS "WordUsage_language_isUsed_idx" ON "WordUsage"("language", "isUsed");
CREATE INDEX IF NOT EXISTS "WordUsage_userId_language_isUsed_idx" ON "WordUsage"("userId", "language", "isUsed");
CREATE INDEX IF NOT EXISTS "WordUsage_userId_language_usedAt_idx" ON "WordUsage"("userId", "language", "usedAt");
CREATE INDEX IF NOT EXISTS "WordUsage_usedAt_idx" ON "WordUsage"("usedAt"); 