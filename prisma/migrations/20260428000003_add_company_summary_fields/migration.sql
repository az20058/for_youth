-- AlterTable
ALTER TABLE "CompanySummary" ADD COLUMN "referenceSites" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN "idealCandidate" TEXT NOT NULL DEFAULT '[]';
