-- CreateTable
CREATE TABLE "YouthPolicy" (
    "plcyNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agency" TEXT NOT NULL,
    "mainCategory" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "supportContent" TEXT,
    "applicationUrl" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "region" TEXT,
    "zipCodes" TEXT,
    "bizPrdEndYmd" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YouthPolicy_pkey" PRIMARY KEY ("plcyNo")
);
