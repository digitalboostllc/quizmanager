-- Add GIN index for template name search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "Template_name_gin_idx" ON "Template" USING gin (name gin_trgm_ops);

-- Add index for template sorting
CREATE INDEX IF NOT EXISTS "Template_createdAt_desc_idx" ON "Template"("createdAt" DESC);

-- Add index for template type filtering with sorting
CREATE INDEX IF NOT EXISTS "Template_quizType_createdAt_desc_idx" ON "Template"("quizType", "createdAt" DESC); 