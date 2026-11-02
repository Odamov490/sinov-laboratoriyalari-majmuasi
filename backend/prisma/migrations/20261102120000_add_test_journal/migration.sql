-- CreateEnum
CREATE TYPE "TestDirection" AS ENUM ('XAVFSIZLIK', 'EMC', 'ENERGIYA', 'SHOVQIN');

-- CreateEnum
CREATE TYPE "JournalResult" AS ENUM ('MOS', 'MOS_EMAS', 'QISMAN_MOS_EMAS', 'NAMUNA_TAQDIM_ETILMADI', 'BEKOR_QILINDI', 'KUTILMOQDA', 'KORIB_CHIQISH');

-- CreateEnum
CREATE TYPE "JournalPayment" AS ENUM ('TOLANGAN', 'TOLANMAGAN');

-- CreateEnum
CREATE TYPE "JournalCancelledBy" AS ENUM ('ARIZACHI', 'ORGAN');

-- CreateTable
CREATE TABLE "TestProductType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameUz" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestProductType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestLocation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameUz" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificationBody" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificationBody_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestJournalRecord" (
    "id" TEXT NOT NULL,
    "importKey" TEXT,
    "sourceSheet" TEXT,
    "sourceRow" INTEGER,
    "sheetNo" INTEGER,
    "journalYear" INTEGER NOT NULL,
    "productTypeId" TEXT NOT NULL,
    "certificationBodyId" TEXT,
    "actNo" TEXT,
    "actDate" DATE,
    "executorName" TEXT,
    "sampleReceivedDate" DATE,
    "sampleReceivedTime" TEXT,
    "sampleCount" INTEGER,
    "cancelledSampleCount" INTEGER NOT NULL DEFAULT 0,
    "weightNote" TEXT,
    "protocolDate" DATE,
    "directions" "TestDirection"[],
    "result" "JournalResult" NOT NULL,
    "nonconformingCount" INTEGER,
    "cancelledBy" "JournalCancelledBy",
    "brand" TEXT,
    "locationId" TEXT,
    "isRepeat" BOOLEAN NOT NULL DEFAULT false,
    "contractNo" TEXT,
    "contractDate" DATE,
    "amount" DECIMAL(14,2),
    "paymentStatus" "JournalPayment",
    "notes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "raw" JSONB,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TestJournalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TestProductType_code_key" ON "TestProductType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TestLocation_code_key" ON "TestLocation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CertificationBody_name_key" ON "CertificationBody"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TestJournalRecord_importKey_key" ON "TestJournalRecord"("importKey");

-- CreateIndex
CREATE INDEX "TestJournalRecord_actNo_idx" ON "TestJournalRecord"("actNo");

-- CreateIndex
CREATE INDEX "TestJournalRecord_sampleReceivedDate_idx" ON "TestJournalRecord"("sampleReceivedDate");

-- CreateIndex
CREATE INDEX "TestJournalRecord_productTypeId_idx" ON "TestJournalRecord"("productTypeId");

-- CreateIndex
CREATE INDEX "TestJournalRecord_certificationBodyId_idx" ON "TestJournalRecord"("certificationBodyId");

-- CreateIndex
CREATE INDEX "TestJournalRecord_result_idx" ON "TestJournalRecord"("result");

-- CreateIndex
CREATE INDEX "TestJournalRecord_needsReview_idx" ON "TestJournalRecord"("needsReview");

-- CreateIndex
CREATE INDEX "TestJournalRecord_journalYear_idx" ON "TestJournalRecord"("journalYear");

-- AddForeignKey
ALTER TABLE "TestJournalRecord" ADD CONSTRAINT "TestJournalRecord_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "TestProductType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestJournalRecord" ADD CONSTRAINT "TestJournalRecord_certificationBodyId_fkey" FOREIGN KEY ("certificationBodyId") REFERENCES "CertificationBody"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestJournalRecord" ADD CONSTRAINT "TestJournalRecord_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "TestLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

