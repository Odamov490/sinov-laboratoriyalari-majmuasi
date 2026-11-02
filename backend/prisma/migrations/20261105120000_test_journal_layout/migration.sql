-- AlterTable
ALTER TABLE "TestJournalRecord" ADD COLUMN     "customFields" JSONB;

-- CreateTable
CREATE TABLE "TestJournalLayout" (
    "id" TEXT NOT NULL,
    "columns" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestJournalLayout_pkey" PRIMARY KEY ("id")
);

