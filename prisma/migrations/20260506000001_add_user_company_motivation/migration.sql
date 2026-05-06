-- CreateTable
CREATE TABLE "UserCompanyMotivation" (
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "motivationHints" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCompanyMotivation_pkey" PRIMARY KEY ("userId", "companyName")
);

-- CreateIndex
CREATE INDEX "UserCompanyMotivation_userId_idx" ON "UserCompanyMotivation"("userId");

-- AddForeignKey
ALTER TABLE "UserCompanyMotivation" ADD CONSTRAINT "UserCompanyMotivation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
