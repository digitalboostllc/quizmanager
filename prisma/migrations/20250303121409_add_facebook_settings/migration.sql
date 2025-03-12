-- CreateTable
CREATE TABLE "facebook_settings" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "appSecret" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "pageAccessToken" TEXT NOT NULL,
    "pageName" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facebook_settings_pkey" PRIMARY KEY ("id")
);
