-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'UNPAID');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('QUIZ', 'TEMPLATE', 'SCHEDULED_POST', 'AI_GENERATION', 'API_REQUEST');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'VOID', 'UNCOLLECTIBLE');

-- DropForeignKey
ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_templateId_fkey";

-- DropForeignKey
ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_userId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduledPost" DROP CONSTRAINT "ScheduledPost_quizId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "WordUsage" DROP CONSTRAINT "WordUsage_userId_fkey";

-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "batchId" TEXT;

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "stripePriceId" TEXT,
    "stripePriceIdMonthly" TEXT,
    "stripePriceIdYearly" TEXT,
    "features" JSONB NOT NULL,
    "limits" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "monthlyPrice" DOUBLE PRECISION,
    "yearlyPrice" DOUBLE PRECISION,
    "oneTimePrice" DOUBLE PRECISION,
    "stripeProductId" TEXT,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'INACTIVE',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "trialEndDate" TIMESTAMP(3),
    "interval" "BillingInterval",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION,
    "stripeSubscriptionData" JSONB,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionEvent" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "oldStatus" "SubscriptionStatus",
    "newStatus" "SubscriptionStatus",
    "oldPlanId" TEXT,
    "newPlanId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceType" "ResourceType" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "billingPeriodStart" TIMESTAMP(3),
    "billingPeriodEnd" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "invoicePdf" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discountPercent" INTEGER,
    "discountAmount" INTEGER,
    "stripePromotionId" TEXT,
    "maxRedemptions" INTEGER,
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizBatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateIds" TEXT[],
    "count" INTEGER NOT NULL,
    "theme" TEXT,
    "difficulty" TEXT NOT NULL,
    "variety" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "currentStage" TEXT NOT NULL DEFAULT 'preparing',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "timeSlotDistribution" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_stripePriceId_key" ON "SubscriptionPlan"("stripePriceId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_stripePriceIdMonthly_key" ON "SubscriptionPlan"("stripePriceIdMonthly");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_stripePriceIdYearly_key" ON "SubscriptionPlan"("stripePriceIdYearly");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_stripeProductId_key" ON "SubscriptionPlan"("stripeProductId");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_isActive_sortOrder_idx" ON "SubscriptionPlan"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Subscription_stripeSubscriptionId_idx" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_createdAt_idx" ON "Subscription"("createdAt");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_subscriptionId_idx" ON "SubscriptionEvent"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_userId_idx" ON "SubscriptionEvent"("userId");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_event_idx" ON "SubscriptionEvent"("event");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_createdAt_idx" ON "SubscriptionEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_subscriptionId_createdAt_idx" ON "SubscriptionEvent"("subscriptionId", "createdAt");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_userId_event_idx" ON "SubscriptionEvent"("userId", "event");

-- CreateIndex
CREATE INDEX "UsageRecord_userId_idx" ON "UsageRecord"("userId");

-- CreateIndex
CREATE INDEX "UsageRecord_resourceType_idx" ON "UsageRecord"("resourceType");

-- CreateIndex
CREATE INDEX "UsageRecord_period_idx" ON "UsageRecord"("period");

-- CreateIndex
CREATE INDEX "UsageRecord_userId_period_idx" ON "UsageRecord"("userId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "UsageRecord_userId_resourceType_period_key" ON "UsageRecord"("userId", "resourceType", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_stripeInvoiceId_key" ON "Invoice"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "Invoice_userId_idx" ON "Invoice"("userId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_stripeInvoiceId_idx" ON "Invoice"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionCode_code_key" ON "PromotionCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionCode_stripePromotionId_key" ON "PromotionCode"("stripePromotionId");

-- CreateIndex
CREATE INDEX "PromotionCode_code_isActive_idx" ON "PromotionCode"("code", "isActive");

-- CreateIndex
CREATE INDEX "PromotionCode_expiresAt_idx" ON "PromotionCode"("expiresAt");

-- CreateIndex
CREATE INDEX "PromotionCode_stripePromotionId_idx" ON "PromotionCode"("stripePromotionId");

-- CreateIndex
CREATE INDEX "QuizBatch_userId_idx" ON "QuizBatch"("userId");

-- CreateIndex
CREATE INDEX "QuizBatch_status_idx" ON "QuizBatch"("status");

-- CreateIndex
CREATE INDEX "QuizBatch_createdAt_idx" ON "QuizBatch"("createdAt");

-- CreateIndex
CREATE INDEX "QuizBatch_userId_status_idx" ON "QuizBatch"("userId", "status");

-- CreateIndex
CREATE INDEX "AutoScheduleSlot_isActive_dayOfWeek_idx" ON "AutoScheduleSlot"("isActive", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Quiz_title_idx" ON "Quiz"("title");

-- CreateIndex
CREATE INDEX "Quiz_status_idx" ON "Quiz"("status");

-- CreateIndex
CREATE INDEX "Quiz_createdAt_idx" ON "Quiz"("createdAt");

-- CreateIndex
CREATE INDEX "Quiz_templateId_idx" ON "Quiz"("templateId");

-- CreateIndex
CREATE INDEX "Quiz_status_createdAt_idx" ON "Quiz"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Quiz_templateId_status_idx" ON "Quiz"("templateId", "status");

-- CreateIndex
CREATE INDEX "Quiz_language_createdAt_idx" ON "Quiz"("language", "createdAt");

-- CreateIndex
CREATE INDEX "Quiz_batchId_idx" ON "Quiz"("batchId");

-- CreateIndex
CREATE INDEX "ScheduledPost_status_scheduledAt_idx" ON "ScheduledPost"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "ScheduledPost_quizId_status_idx" ON "ScheduledPost"("quizId", "status");

-- CreateIndex
CREATE INDEX "Session_expires_idx" ON "Session"("expires");

-- CreateIndex
CREATE INDEX "Template_quizType_createdAt_idx" ON "Template"("quizType", "createdAt");

-- CreateIndex
CREATE INDEX "Template_quizType_name_idx" ON "Template"("quizType", "name");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "VerificationToken_expires_idx" ON "VerificationToken"("expires");

-- CreateIndex
CREATE INDEX "WordUsage_language_isUsed_idx" ON "WordUsage"("language", "isUsed");

-- CreateIndex
CREATE INDEX "WordUsage_userId_language_isUsed_idx" ON "WordUsage"("userId", "language", "isUsed");

-- CreateIndex
CREATE INDEX "WordUsage_userId_language_usedAt_idx" ON "WordUsage"("userId", "language", "usedAt");

-- CreateIndex
CREATE INDEX "WordUsage_usedAt_idx" ON "WordUsage"("usedAt");
