-- CreateTable
CREATE TABLE "AutoScheduleSlot" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "timeOfDay" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoScheduleSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutoScheduleSlot_dayOfWeek_timeOfDay_idx" ON "AutoScheduleSlot"("dayOfWeek", "timeOfDay");

-- CreateIndex
CREATE UNIQUE INDEX "AutoScheduleSlot_dayOfWeek_timeOfDay_key" ON "AutoScheduleSlot"("dayOfWeek", "timeOfDay");
