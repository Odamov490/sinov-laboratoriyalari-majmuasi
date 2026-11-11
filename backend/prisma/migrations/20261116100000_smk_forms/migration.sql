-- SMK: 10 ta eski modul olib tashlandi; o'rniga elektron formalar (kutubxona, laboratoriyaga biriktirish, yozuvlar).
-- DropForeignKey
ALTER TABLE "NonConformance" DROP CONSTRAINT "NonConformance_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "NonConformance" DROP CONSTRAINT "NonConformance_responsibleUserId_fkey";

-- DropForeignKey
ALTER TABLE "Complaint" DROP CONSTRAINT "Complaint_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "Complaint" DROP CONSTRAINT "Complaint_relatedApplicationId_fkey";

-- DropForeignKey
ALTER TABLE "Complaint" DROP CONSTRAINT "Complaint_responsibleUserId_fkey";

-- DropForeignKey
ALTER TABLE "SMKDocument" DROP CONSTRAINT "SMKDocument_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "SMKDocument" DROP CONSTRAINT "SMKDocument_ownerUserId_fkey";

-- DropForeignKey
ALTER TABLE "InternalAudit" DROP CONSTRAINT "InternalAudit_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "InternalAudit" DROP CONSTRAINT "InternalAudit_auditorUserId_fkey";

-- DropForeignKey
ALTER TABLE "CalibrationRecord" DROP CONSTRAINT "CalibrationRecord_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "CalibrationRecord" DROP CONSTRAINT "CalibrationRecord_equipmentId_fkey";

-- DropForeignKey
ALTER TABLE "TrainingRecord" DROP CONSTRAINT "TrainingRecord_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "TrainingRecord" DROP CONSTRAINT "TrainingRecord_userId_fkey";

-- DropForeignKey
ALTER TABLE "QualityControlRecord" DROP CONSTRAINT "QualityControlRecord_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "ProficiencyTest" DROP CONSTRAINT "ProficiencyTest_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "MeasurementUncertainty" DROP CONSTRAINT "MeasurementUncertainty_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "MeasurementUncertainty" DROP CONSTRAINT "MeasurementUncertainty_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "RiskItem" DROP CONSTRAINT "RiskItem_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "RiskItem" DROP CONSTRAINT "RiskItem_ownerUserId_fkey";

-- DropTable
DROP TABLE "NonConformance";

-- DropTable
DROP TABLE "Complaint";

-- DropTable
DROP TABLE "SMKDocument";

-- DropTable
DROP TABLE "InternalAudit";

-- DropTable
DROP TABLE "CalibrationRecord";

-- DropTable
DROP TABLE "TrainingRecord";

-- DropTable
DROP TABLE "QualityControlRecord";

-- DropTable
DROP TABLE "ProficiencyTest";

-- DropTable
DROP TABLE "MeasurementUncertainty";

-- DropTable
DROP TABLE "RiskItem";

-- DropEnum
DROP TYPE "NonConformanceSource";

-- DropEnum
DROP TYPE "NonConformanceStatus";

-- DropEnum
DROP TYPE "ComplaintStatus";

-- DropEnum
DROP TYPE "SMKDocumentCategory";

-- DropEnum
DROP TYPE "SMKDocumentStatus";

-- DropEnum
DROP TYPE "InternalAuditStatus";

-- DropEnum
DROP TYPE "ProficiencyResultStatus";

-- DropEnum
DROP TYPE "RiskStatus";

-- CreateTable
CREATE TABLE "SmkForm" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "templateUrl" TEXT,
    "templateName" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmkForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmkLabForm" (
    "laboratoryId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmkLabForm_pkey" PRIMARY KEY ("laboratoryId","formId")
);

-- CreateTable
CREATE TABLE "SmkFormEntry" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "laboratoryId" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmkFormEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmkForm_code_key" ON "SmkForm"("code");

-- CreateIndex
CREATE INDEX "SmkLabForm_formId_idx" ON "SmkLabForm"("formId");

-- CreateIndex
CREATE INDEX "SmkFormEntry_formId_laboratoryId_createdAt_idx" ON "SmkFormEntry"("formId", "laboratoryId", "createdAt");

-- CreateIndex
CREATE INDEX "SmkFormEntry_laboratoryId_idx" ON "SmkFormEntry"("laboratoryId");

-- AddForeignKey
ALTER TABLE "SmkLabForm" ADD CONSTRAINT "SmkLabForm_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmkLabForm" ADD CONSTRAINT "SmkLabForm_formId_fkey" FOREIGN KEY ("formId") REFERENCES "SmkForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmkFormEntry" ADD CONSTRAINT "SmkFormEntry_formId_fkey" FOREIGN KEY ("formId") REFERENCES "SmkForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmkFormEntry" ADD CONSTRAINT "SmkFormEntry_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmkFormEntry" ADD CONSTRAINT "SmkFormEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

