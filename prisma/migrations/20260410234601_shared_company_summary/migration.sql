-- DropForeignKey
ALTER TABLE "CompanySummary" DROP CONSTRAINT "CompanySummary_applicationId_fkey";

-- DropIndex
DROP INDEX "CompanySummary_applicationId_key";

-- AlterTable: applicationId → companyName
ALTER TABLE "CompanySummary" DROP COLUMN "applicationId";
ALTER TABLE "CompanySummary" ADD COLUMN "companyName" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "CompanySummary_companyName_key" ON "CompanySummary"("companyName");
