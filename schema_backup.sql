--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 14.17 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: BillingInterval; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BillingInterval" AS ENUM (
    'MONTHLY',
    'YEARLY'
);


--
-- Name: ContentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContentType" AS ENUM (
    'WORD',
    'NUMBER',
    'SEQUENCE',
    'CONCEPT',
    'RHYME',
    'CUSTOM'
);


--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'PENDING',
    'PAID',
    'VOID',
    'UNCOLLECTIBLE'
);


--
-- Name: PostStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PostStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'PUBLISHED',
    'FAILED',
    'CANCELLED'
);


--
-- Name: QuizStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QuizStatus" AS ENUM (
    'DRAFT',
    'SCHEDULED',
    'PUBLISHED',
    'FAILED',
    'READY'
);


--
-- Name: QuizType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QuizType" AS ENUM (
    'WORDLE',
    'NUMBER_SEQUENCE',
    'RHYME_TIME',
    'CONCEPT_CONNECTION'
);


--
-- Name: ResourceType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ResourceType" AS ENUM (
    'QUIZ',
    'TEMPLATE',
    'SCHEDULED_POST',
    'AI_GENERATION',
    'API_REQUEST'
);


--
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SubscriptionStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'TRIALING',
    'PAST_DUE',
    'CANCELED',
    'UNPAID'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'ADMIN'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AutoScheduleSlot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AutoScheduleSlot" (
    id text NOT NULL,
    "dayOfWeek" integer NOT NULL,
    "timeOfDay" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ContentUsage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ContentUsage" (
    id text NOT NULL,
    "userId" text,
    "contentType" public."ContentType" DEFAULT 'WORD'::public."ContentType" NOT NULL,
    value text NOT NULL,
    format text,
    metadata jsonb,
    "isUsed" boolean DEFAULT true NOT NULL,
    "usedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Invoice" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "stripeInvoiceId" text NOT NULL,
    amount integer NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status public."InvoiceStatus" DEFAULT 'PENDING'::public."InvoiceStatus" NOT NULL,
    "billingPeriodStart" timestamp(3) without time zone,
    "billingPeriodEnd" timestamp(3) without time zone,
    "paidAt" timestamp(3) without time zone,
    "invoicePdf" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PromotionCode; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PromotionCode" (
    id text NOT NULL,
    code text NOT NULL,
    description text NOT NULL,
    "discountPercent" integer,
    "discountAmount" integer,
    "stripePromotionId" text,
    "maxRedemptions" integer,
    "redemptionCount" integer DEFAULT 0 NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Quiz; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Quiz" (
    id text NOT NULL,
    title text NOT NULL,
    answer text NOT NULL,
    solution text,
    variables jsonb,
    "templateId" text NOT NULL,
    "imageUrl" text,
    status public."QuizStatus" DEFAULT 'DRAFT'::public."QuizStatus" NOT NULL,
    language text DEFAULT 'en'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text,
    "batchId" text
);


--
-- Name: QuizBatch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QuizBatch" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "templateIds" text[],
    count integer NOT NULL,
    theme text,
    difficulty text NOT NULL,
    variety integer NOT NULL,
    language text NOT NULL,
    status text DEFAULT 'PROCESSING'::text NOT NULL,
    "completedCount" integer DEFAULT 0 NOT NULL,
    "currentStage" text DEFAULT 'preparing'::text NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "errorMessage" text,
    "timeSlotDistribution" jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ScheduledPost; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ScheduledPost" (
    id text NOT NULL,
    "quizId" text NOT NULL,
    "scheduledAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    status public."PostStatus" DEFAULT 'PENDING'::public."PostStatus" NOT NULL,
    "fbPostId" text,
    caption text,
    "errorMessage" text,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "lastRetryAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Settings" (
    id text DEFAULT 'default'::text NOT NULL,
    "autoScheduleEnabled" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Subscription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Subscription" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "stripeCustomerId" text,
    "stripeSubscriptionId" text,
    "planId" text NOT NULL,
    status public."SubscriptionStatus" DEFAULT 'INACTIVE'::public."SubscriptionStatus" NOT NULL,
    "currentPeriodStart" timestamp(3) without time zone,
    "currentPeriodEnd" timestamp(3) without time zone,
    "cancelAtPeriodEnd" boolean DEFAULT false NOT NULL,
    "canceledAt" timestamp(3) without time zone,
    "trialEndDate" timestamp(3) without time zone,
    "interval" public."BillingInterval",
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    amount double precision,
    "stripeSubscriptionData" jsonb
);


--
-- Name: SubscriptionEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SubscriptionEvent" (
    id text NOT NULL,
    "subscriptionId" text NOT NULL,
    "userId" text NOT NULL,
    event text NOT NULL,
    "oldStatus" public."SubscriptionStatus",
    "newStatus" public."SubscriptionStatus",
    "oldPlanId" text,
    "newPlanId" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: SubscriptionPlan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SubscriptionPlan" (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    "stripePriceId" text,
    "stripePriceIdMonthly" text,
    "stripePriceIdYearly" text,
    features jsonb NOT NULL,
    limits jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "monthlyPrice" double precision,
    "yearlyPrice" double precision,
    "oneTimePrice" double precision,
    "stripeProductId" text
);


--
-- Name: Template; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Template" (
    id text NOT NULL,
    name text NOT NULL,
    html text NOT NULL,
    css text,
    variables jsonb NOT NULL,
    "quizType" public."QuizType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "imageUrl" text,
    description text,
    "userId" text NOT NULL,
    "planId" text,
    "isPublic" boolean DEFAULT false NOT NULL,
    "previewImageUrl" text
);


--
-- Name: UsageRecord; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UsageRecord" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "resourceType" public."ResourceType" NOT NULL,
    count integer DEFAULT 0 NOT NULL,
    period text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text,
    email text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    image text,
    password text,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VerificationToken" (
    id text NOT NULL,
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: WordUsage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WordUsage" (
    id text NOT NULL,
    "userId" text NOT NULL,
    word text NOT NULL,
    language text NOT NULL,
    "isUsed" boolean DEFAULT true NOT NULL,
    "usedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: facebook_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facebook_settings (
    id text NOT NULL,
    "appId" text NOT NULL,
    "appSecret" text NOT NULL,
    "pageId" text NOT NULL,
    "pageAccessToken" text NOT NULL,
    "pageName" text,
    "isConnected" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AutoScheduleSlot AutoScheduleSlot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AutoScheduleSlot"
    ADD CONSTRAINT "AutoScheduleSlot_pkey" PRIMARY KEY (id);


--
-- Name: ContentUsage ContentUsage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContentUsage"
    ADD CONSTRAINT "ContentUsage_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: PromotionCode PromotionCode_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PromotionCode"
    ADD CONSTRAINT "PromotionCode_pkey" PRIMARY KEY (id);


--
-- Name: QuizBatch QuizBatch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuizBatch"
    ADD CONSTRAINT "QuizBatch_pkey" PRIMARY KEY (id);


--
-- Name: Quiz Quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Quiz"
    ADD CONSTRAINT "Quiz_pkey" PRIMARY KEY (id);


--
-- Name: ScheduledPost ScheduledPost_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ScheduledPost"
    ADD CONSTRAINT "ScheduledPost_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Settings Settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Settings"
    ADD CONSTRAINT "Settings_pkey" PRIMARY KEY (id);


--
-- Name: SubscriptionEvent SubscriptionEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubscriptionEvent"
    ADD CONSTRAINT "SubscriptionEvent_pkey" PRIMARY KEY (id);


--
-- Name: SubscriptionPlan SubscriptionPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubscriptionPlan"
    ADD CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY (id);


--
-- Name: Subscription Subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_pkey" PRIMARY KEY (id);


--
-- Name: Template Template_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Template"
    ADD CONSTRAINT "Template_pkey" PRIMARY KEY (id);


--
-- Name: UsageRecord UsageRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UsageRecord"
    ADD CONSTRAINT "UsageRecord_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VerificationToken VerificationToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VerificationToken"
    ADD CONSTRAINT "VerificationToken_pkey" PRIMARY KEY (id);


--
-- Name: WordUsage WordUsage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WordUsage"
    ADD CONSTRAINT "WordUsage_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: facebook_settings facebook_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facebook_settings
    ADD CONSTRAINT facebook_settings_pkey PRIMARY KEY (id);


--
-- Name: AutoScheduleSlot_dayOfWeek_timeOfDay_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AutoScheduleSlot_dayOfWeek_timeOfDay_idx" ON public."AutoScheduleSlot" USING btree ("dayOfWeek", "timeOfDay");


--
-- Name: AutoScheduleSlot_dayOfWeek_timeOfDay_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AutoScheduleSlot_dayOfWeek_timeOfDay_key" ON public."AutoScheduleSlot" USING btree ("dayOfWeek", "timeOfDay");


--
-- Name: AutoScheduleSlot_isActive_dayOfWeek_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AutoScheduleSlot_isActive_dayOfWeek_idx" ON public."AutoScheduleSlot" USING btree ("isActive", "dayOfWeek");


--
-- Name: ContentUsage_contentType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContentUsage_contentType_idx" ON public."ContentUsage" USING btree ("contentType");


--
-- Name: ContentUsage_contentType_isUsed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContentUsage_contentType_isUsed_idx" ON public."ContentUsage" USING btree ("contentType", "isUsed");


--
-- Name: ContentUsage_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContentUsage_createdAt_idx" ON public."ContentUsage" USING btree ("createdAt");


--
-- Name: ContentUsage_format_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContentUsage_format_idx" ON public."ContentUsage" USING btree (format);


--
-- Name: ContentUsage_isUsed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContentUsage_isUsed_idx" ON public."ContentUsage" USING btree ("isUsed");


--
-- Name: ContentUsage_usedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContentUsage_usedAt_idx" ON public."ContentUsage" USING btree ("usedAt");


--
-- Name: ContentUsage_userId_contentType_isUsed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContentUsage_userId_contentType_isUsed_idx" ON public."ContentUsage" USING btree ("userId", "contentType", "isUsed");


--
-- Name: ContentUsage_userId_contentType_usedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContentUsage_userId_contentType_usedAt_idx" ON public."ContentUsage" USING btree ("userId", "contentType", "usedAt");


--
-- Name: ContentUsage_userId_contentType_value_format_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ContentUsage_userId_contentType_value_format_key" ON public."ContentUsage" USING btree ("userId", "contentType", value, format);


--
-- Name: ContentUsage_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContentUsage_userId_idx" ON public."ContentUsage" USING btree ("userId");


--
-- Name: ContentUsage_value_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContentUsage_value_idx" ON public."ContentUsage" USING btree (value);


--
-- Name: Invoice_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Invoice_createdAt_idx" ON public."Invoice" USING btree ("createdAt");


--
-- Name: Invoice_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Invoice_status_idx" ON public."Invoice" USING btree (status);


--
-- Name: Invoice_stripeInvoiceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Invoice_stripeInvoiceId_idx" ON public."Invoice" USING btree ("stripeInvoiceId");


--
-- Name: Invoice_stripeInvoiceId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Invoice_stripeInvoiceId_key" ON public."Invoice" USING btree ("stripeInvoiceId");


--
-- Name: Invoice_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Invoice_userId_idx" ON public."Invoice" USING btree ("userId");


--
-- Name: PromotionCode_code_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PromotionCode_code_isActive_idx" ON public."PromotionCode" USING btree (code, "isActive");


--
-- Name: PromotionCode_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PromotionCode_code_key" ON public."PromotionCode" USING btree (code);


--
-- Name: PromotionCode_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PromotionCode_expiresAt_idx" ON public."PromotionCode" USING btree ("expiresAt");


--
-- Name: PromotionCode_stripePromotionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PromotionCode_stripePromotionId_idx" ON public."PromotionCode" USING btree ("stripePromotionId");


--
-- Name: PromotionCode_stripePromotionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PromotionCode_stripePromotionId_key" ON public."PromotionCode" USING btree ("stripePromotionId");


--
-- Name: QuizBatch_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QuizBatch_createdAt_idx" ON public."QuizBatch" USING btree ("createdAt");


--
-- Name: QuizBatch_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QuizBatch_status_idx" ON public."QuizBatch" USING btree (status);


--
-- Name: QuizBatch_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QuizBatch_userId_idx" ON public."QuizBatch" USING btree ("userId");


--
-- Name: QuizBatch_userId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QuizBatch_userId_status_idx" ON public."QuizBatch" USING btree ("userId", status);


--
-- Name: Quiz_batchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Quiz_batchId_idx" ON public."Quiz" USING btree ("batchId");


--
-- Name: Quiz_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Quiz_createdAt_idx" ON public."Quiz" USING btree ("createdAt");


--
-- Name: Quiz_language_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Quiz_language_createdAt_idx" ON public."Quiz" USING btree (language, "createdAt");


--
-- Name: Quiz_status_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Quiz_status_createdAt_idx" ON public."Quiz" USING btree (status, "createdAt");


--
-- Name: Quiz_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Quiz_status_idx" ON public."Quiz" USING btree (status);


--
-- Name: Quiz_templateId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Quiz_templateId_idx" ON public."Quiz" USING btree ("templateId");


--
-- Name: Quiz_templateId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Quiz_templateId_status_idx" ON public."Quiz" USING btree ("templateId", status);


--
-- Name: Quiz_title_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Quiz_title_idx" ON public."Quiz" USING btree (title);


--
-- Name: Quiz_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Quiz_userId_idx" ON public."Quiz" USING btree ("userId");


--
-- Name: ScheduledPost_quizId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ScheduledPost_quizId_idx" ON public."ScheduledPost" USING btree ("quizId");


--
-- Name: ScheduledPost_quizId_scheduledAt_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ScheduledPost_quizId_scheduledAt_key" ON public."ScheduledPost" USING btree ("quizId", "scheduledAt");


--
-- Name: ScheduledPost_quizId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ScheduledPost_quizId_status_idx" ON public."ScheduledPost" USING btree ("quizId", status);


--
-- Name: ScheduledPost_scheduledAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ScheduledPost_scheduledAt_idx" ON public."ScheduledPost" USING btree ("scheduledAt");


--
-- Name: ScheduledPost_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ScheduledPost_status_idx" ON public."ScheduledPost" USING btree (status);


--
-- Name: ScheduledPost_status_scheduledAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ScheduledPost_status_scheduledAt_idx" ON public."ScheduledPost" USING btree (status, "scheduledAt");


--
-- Name: Session_expires_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Session_expires_idx" ON public."Session" USING btree (expires);


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: SubscriptionEvent_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SubscriptionEvent_createdAt_idx" ON public."SubscriptionEvent" USING btree ("createdAt");


--
-- Name: SubscriptionEvent_event_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SubscriptionEvent_event_idx" ON public."SubscriptionEvent" USING btree (event);


--
-- Name: SubscriptionEvent_subscriptionId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SubscriptionEvent_subscriptionId_createdAt_idx" ON public."SubscriptionEvent" USING btree ("subscriptionId", "createdAt");


--
-- Name: SubscriptionEvent_subscriptionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SubscriptionEvent_subscriptionId_idx" ON public."SubscriptionEvent" USING btree ("subscriptionId");


--
-- Name: SubscriptionEvent_userId_event_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SubscriptionEvent_userId_event_idx" ON public."SubscriptionEvent" USING btree ("userId", event);


--
-- Name: SubscriptionEvent_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SubscriptionEvent_userId_idx" ON public."SubscriptionEvent" USING btree ("userId");


--
-- Name: SubscriptionPlan_isActive_sortOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SubscriptionPlan_isActive_sortOrder_idx" ON public."SubscriptionPlan" USING btree ("isActive", "sortOrder");


--
-- Name: SubscriptionPlan_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON public."SubscriptionPlan" USING btree (name);


--
-- Name: SubscriptionPlan_stripePriceIdMonthly_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SubscriptionPlan_stripePriceIdMonthly_key" ON public."SubscriptionPlan" USING btree ("stripePriceIdMonthly");


--
-- Name: SubscriptionPlan_stripePriceIdYearly_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SubscriptionPlan_stripePriceIdYearly_key" ON public."SubscriptionPlan" USING btree ("stripePriceIdYearly");


--
-- Name: SubscriptionPlan_stripePriceId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SubscriptionPlan_stripePriceId_key" ON public."SubscriptionPlan" USING btree ("stripePriceId");


--
-- Name: SubscriptionPlan_stripeProductId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SubscriptionPlan_stripeProductId_key" ON public."SubscriptionPlan" USING btree ("stripeProductId");


--
-- Name: Subscription_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Subscription_createdAt_idx" ON public."Subscription" USING btree ("createdAt");


--
-- Name: Subscription_currentPeriodEnd_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Subscription_currentPeriodEnd_idx" ON public."Subscription" USING btree ("currentPeriodEnd");


--
-- Name: Subscription_planId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Subscription_planId_idx" ON public."Subscription" USING btree ("planId");


--
-- Name: Subscription_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Subscription_status_idx" ON public."Subscription" USING btree (status);


--
-- Name: Subscription_stripeCustomerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Subscription_stripeCustomerId_idx" ON public."Subscription" USING btree ("stripeCustomerId");


--
-- Name: Subscription_stripeCustomerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON public."Subscription" USING btree ("stripeCustomerId");


--
-- Name: Subscription_stripeSubscriptionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Subscription_stripeSubscriptionId_idx" ON public."Subscription" USING btree ("stripeSubscriptionId");


--
-- Name: Subscription_stripeSubscriptionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON public."Subscription" USING btree ("stripeSubscriptionId");


--
-- Name: Subscription_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Subscription_userId_idx" ON public."Subscription" USING btree ("userId");


--
-- Name: Subscription_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Subscription_userId_key" ON public."Subscription" USING btree ("userId");


--
-- Name: Template_isPublic_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Template_isPublic_idx" ON public."Template" USING btree ("isPublic");


--
-- Name: Template_planId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Template_planId_idx" ON public."Template" USING btree ("planId");


--
-- Name: Template_quizType_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Template_quizType_createdAt_idx" ON public."Template" USING btree ("quizType", "createdAt");


--
-- Name: Template_quizType_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Template_quizType_name_idx" ON public."Template" USING btree ("quizType", name);


--
-- Name: Template_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Template_userId_idx" ON public."Template" USING btree ("userId");


--
-- Name: UsageRecord_period_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UsageRecord_period_idx" ON public."UsageRecord" USING btree (period);


--
-- Name: UsageRecord_resourceType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UsageRecord_resourceType_idx" ON public."UsageRecord" USING btree ("resourceType");


--
-- Name: UsageRecord_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UsageRecord_userId_idx" ON public."UsageRecord" USING btree ("userId");


--
-- Name: UsageRecord_userId_period_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UsageRecord_userId_period_idx" ON public."UsageRecord" USING btree ("userId", period);


--
-- Name: UsageRecord_userId_resourceType_period_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UsageRecord_userId_resourceType_period_key" ON public."UsageRecord" USING btree ("userId", "resourceType", period);


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: VerificationToken_expires_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VerificationToken_expires_idx" ON public."VerificationToken" USING btree (expires);


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: WordUsage_language_isUsed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WordUsage_language_isUsed_idx" ON public."WordUsage" USING btree (language, "isUsed");


--
-- Name: WordUsage_usedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WordUsage_usedAt_idx" ON public."WordUsage" USING btree ("usedAt");


--
-- Name: WordUsage_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WordUsage_userId_idx" ON public."WordUsage" USING btree ("userId");


--
-- Name: WordUsage_userId_language_isUsed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WordUsage_userId_language_isUsed_idx" ON public."WordUsage" USING btree ("userId", language, "isUsed");


--
-- Name: WordUsage_userId_language_usedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WordUsage_userId_language_usedAt_idx" ON public."WordUsage" USING btree ("userId", language, "usedAt");


--
-- Name: WordUsage_userId_word_language_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "WordUsage_userId_word_language_key" ON public."WordUsage" USING btree ("userId", word, language);


--
-- Name: WordUsage_word_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WordUsage_word_idx" ON public."WordUsage" USING btree (word);


--
-- PostgreSQL database dump complete
--

