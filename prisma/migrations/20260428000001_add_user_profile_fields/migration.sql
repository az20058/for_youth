-- AlterTable
ALTER TABLE "User" ADD COLUMN "bio" TEXT,
ADD COLUMN "school" TEXT,
ADD COLUMN "major" TEXT,
ADD COLUMN "careerLevel" TEXT,
ADD COLUMN "portfolioUrl" TEXT,
ADD COLUMN "resumeUrl" TEXT,
ADD COLUMN "education" JSONB,
ADD COLUMN "careers" JSONB,
ADD COLUMN "certifications" JSONB,
ADD COLUMN "languages" JSONB,
ADD COLUMN "techStacks" JSONB;
