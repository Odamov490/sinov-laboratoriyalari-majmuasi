-- CreateEnum
CREATE TYPE "JournalChangeAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "TestJournalChange" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "JournalChangeAction" NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestJournalChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestJournalPrice" (
    "id" TEXT NOT NULL,
    "productTypeId" TEXT NOT NULL,
    "direction" "TestDirection",
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "validFrom" DATE NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestJournalPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestJournalChange_recordId_idx" ON "TestJournalChange"("recordId");

-- CreateIndex
CREATE INDEX "TestJournalPrice_productTypeId_validFrom_idx" ON "TestJournalPrice"("productTypeId", "validFrom");

-- AddForeignKey
ALTER TABLE "TestJournalChange" ADD CONSTRAINT "TestJournalChange_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "TestJournalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestJournalChange" ADD CONSTRAINT "TestJournalChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestJournalPrice" ADD CONSTRAINT "TestJournalPrice_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "TestProductType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

