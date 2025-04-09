-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('WORD', 'NUMBER', 'SEQUENCE', 'CONCEPT', 'RHYME', 'CUSTOM');

-- CreateTable
CREATE TABLE "ContentUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL DEFAULT 'WORD',
    "value" TEXT NOT NULL,
    "format" TEXT,
    "metadata" JSONB,
    "isUsed" BOOLEAN NOT NULL DEFAULT true,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentUsage_userId_idx" ON "ContentUsage"("userId");

-- CreateIndex
CREATE INDEX "ContentUsage_contentType_idx" ON "ContentUsage"("contentType");

-- CreateIndex
CREATE INDEX "ContentUsage_value_idx" ON "ContentUsage"("value");

-- CreateIndex
CREATE INDEX "ContentUsage_format_idx" ON "ContentUsage"("format");

-- CreateIndex
CREATE INDEX "ContentUsage_isUsed_idx" ON "ContentUsage"("isUsed");

-- CreateIndex
CREATE INDEX "ContentUsage_contentType_isUsed_idx" ON "ContentUsage"("contentType", "isUsed");

-- CreateIndex
CREATE INDEX "ContentUsage_userId_contentType_isUsed_idx" ON "ContentUsage"("userId", "contentType", "isUsed");

-- CreateIndex
CREATE INDEX "ContentUsage_userId_contentType_usedAt_idx" ON "ContentUsage"("userId", "contentType", "usedAt");

-- CreateIndex
CREATE INDEX "ContentUsage_usedAt_idx" ON "ContentUsage"("usedAt");

-- CreateIndex
CREATE INDEX "ContentUsage_createdAt_idx" ON "ContentUsage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentUsage_userId_contentType_value_format_key" ON "ContentUsage"("userId", "contentType", "value", "format");
