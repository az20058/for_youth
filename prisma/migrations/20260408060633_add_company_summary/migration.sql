-- CreateTable
CREATE TABLE "CompanySummary" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "mainBusiness" TEXT NOT NULL,
    "recentNews" TEXT NOT NULL,
    "motivationHints" TEXT NOT NULL,
    "crawledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanySummary_applicationId_key" ON "CompanySummary"("applicationId");

-- AddForeignKey
ALTER TABLE "CompanySummary" ADD CONSTRAINT "CompanySummary_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
