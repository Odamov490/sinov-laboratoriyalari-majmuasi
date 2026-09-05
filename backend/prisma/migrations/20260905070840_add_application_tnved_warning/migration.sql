-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "tnVedWarningCategory" TEXT,
ADD COLUMN     "tnVedWarningShown" BOOLEAN NOT NULL DEFAULT false;
