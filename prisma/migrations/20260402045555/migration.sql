-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'CODING_TEST', 'INTERVIEW', 'APPLIED', 'ACCEPTED', 'REJECTED_DOCS', 'REJECTED_CODING', 'REJECTED_INTERVIEW');

-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('LARGE', 'MID_LARGE', 'MID', 'STARTUP');

-- CreateEnum
CREATE TYPE "CoverLetterType" AS ENUM ('MOTIVATION', 'GROWTH', 'JOB_SKILLS', 'PERSONALITY', 'SUCCESS', 'FAILURE', 'TEAMWORK', 'FUTURE_GOALS', 'OTHER');

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "careerLevel" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "companySize" "CompanySize" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverLetter" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL DEFAULT '',
    "type" "CoverLetterType",
    "applicationId" TEXT NOT NULL,

    CONSTRAINT "CoverLetter_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CoverLetter" ADD CONSTRAINT "CoverLetter_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
