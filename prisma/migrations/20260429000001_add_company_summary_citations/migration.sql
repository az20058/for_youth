-- AlterTable
ALTER TABLE "CompanySummary" ADD COLUMN "sources" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN "schemaVersion" INTEGER NOT NULL DEFAULT 1;
