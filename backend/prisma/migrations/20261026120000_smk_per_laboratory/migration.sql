-- AlterTable
ALTER TABLE "NonConformance" ADD COLUMN     "laboratoryId" TEXT;

-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN     "laboratoryId" TEXT;

-- AlterTable
ALTER TABLE "SMKDocument" ADD COLUMN     "laboratoryId" TEXT;

-- AlterTable
ALTER TABLE "SMKDocumentVersion" ADD COLUMN     "laboratoryId" TEXT;

-- AlterTable
ALTER TABLE "AuditFinding" ADD COLUMN     "laboratoryId" TEXT;

-- AlterTable
ALTER TABLE "CalibrationRecord" ADD COLUMN     "laboratoryId" TEXT;

-- AlterTable
ALTER TABLE "TrainingRecord" ADD COLUMN     "laboratoryId" TEXT;

-- AlterTable
ALTER TABLE "MeasurementUncertainty" ADD COLUMN     "laboratoryId" TEXT;

-- AlterTable
ALTER TABLE "MethodValidation" ADD COLUMN     "laboratoryId" TEXT;

-- AlterTable
ALTER TABLE "ImpartialityDeclaration" ADD COLUMN     "laboratoryId" TEXT;

-- AlterTable
ALTER TABLE "SupplierEvaluation" ADD COLUMN     "laboratoryId" TEXT;

-- AlterTable
ALTER TABLE "Subcontractor" ADD COLUMN     "laboratoryId" TEXT;

-- AlterTable
ALTER TABLE "DocumentAcknowledgment" ADD COLUMN     "laboratoryId" TEXT;

-- AlterTable
ALTER TABLE "ManagementReview" ADD COLUMN     "laboratoryId" TEXT;

-- AlterTable
ALTER TABLE "RiskItem" ADD COLUMN     "laboratoryId" TEXT;

-- AlterTable
ALTER TABLE "QualityObjective" ADD COLUMN     "laboratoryId" TEXT;

-- AlterTable
ALTER TABLE "ImprovementSuggestion" ADD COLUMN     "laboratoryId" TEXT;

-- AlterTable
ALTER TABLE "RetentionPolicy" ADD COLUMN     "laboratoryId" TEXT;

-- CreateIndex
CREATE INDEX "NonConformance_laboratoryId_idx" ON "NonConformance"("laboratoryId");

-- CreateIndex
CREATE INDEX "Complaint_laboratoryId_idx" ON "Complaint"("laboratoryId");

-- CreateIndex
CREATE INDEX "SMKDocument_laboratoryId_idx" ON "SMKDocument"("laboratoryId");

-- CreateIndex
CREATE INDEX "SMKDocumentVersion_laboratoryId_idx" ON "SMKDocumentVersion"("laboratoryId");

-- CreateIndex
CREATE INDEX "InternalAudit_laboratoryId_idx" ON "InternalAudit"("laboratoryId");

-- CreateIndex
CREATE INDEX "AuditFinding_laboratoryId_idx" ON "AuditFinding"("laboratoryId");

-- CreateIndex
CREATE INDEX "CalibrationRecord_laboratoryId_idx" ON "CalibrationRecord"("laboratoryId");

-- CreateIndex
CREATE INDEX "TrainingRecord_laboratoryId_idx" ON "TrainingRecord"("laboratoryId");

-- CreateIndex
CREATE INDEX "QualityControlRecord_laboratoryId_idx" ON "QualityControlRecord"("laboratoryId");

-- CreateIndex
CREATE INDEX "ProficiencyTest_laboratoryId_idx" ON "ProficiencyTest"("laboratoryId");

-- CreateIndex
CREATE INDEX "MeasurementUncertainty_laboratoryId_idx" ON "MeasurementUncertainty"("laboratoryId");

-- CreateIndex
CREATE INDEX "MethodValidation_laboratoryId_idx" ON "MethodValidation"("laboratoryId");

-- CreateIndex
CREATE INDEX "ImpartialityDeclaration_laboratoryId_idx" ON "ImpartialityDeclaration"("laboratoryId");

-- CreateIndex
CREATE INDEX "SupplierEvaluation_laboratoryId_idx" ON "SupplierEvaluation"("laboratoryId");

-- CreateIndex
CREATE INDEX "Subcontractor_laboratoryId_idx" ON "Subcontractor"("laboratoryId");

-- CreateIndex
CREATE INDEX "EnvironmentLog_laboratoryId_idx" ON "EnvironmentLog"("laboratoryId");

-- CreateIndex
CREATE INDEX "DocumentAcknowledgment_laboratoryId_idx" ON "DocumentAcknowledgment"("laboratoryId");

-- CreateIndex
CREATE INDEX "ManagementReview_laboratoryId_idx" ON "ManagementReview"("laboratoryId");

-- CreateIndex
CREATE INDEX "RiskItem_laboratoryId_idx" ON "RiskItem"("laboratoryId");

-- CreateIndex
CREATE INDEX "QualityObjective_laboratoryId_idx" ON "QualityObjective"("laboratoryId");

-- CreateIndex
CREATE INDEX "ImprovementSuggestion_laboratoryId_idx" ON "ImprovementSuggestion"("laboratoryId");

-- CreateIndex
CREATE INDEX "RetentionPolicy_laboratoryId_idx" ON "RetentionPolicy"("laboratoryId");

-- AddForeignKey
ALTER TABLE "NonConformance" ADD CONSTRAINT "NonConformance_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMKDocument" ADD CONSTRAINT "SMKDocument_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMKDocumentVersion" ADD CONSTRAINT "SMKDocumentVersion_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationRecord" ADD CONSTRAINT "CalibrationRecord_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingRecord" ADD CONSTRAINT "TrainingRecord_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementUncertainty" ADD CONSTRAINT "MeasurementUncertainty_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MethodValidation" ADD CONSTRAINT "MethodValidation_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpartialityDeclaration" ADD CONSTRAINT "ImpartialityDeclaration_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierEvaluation" ADD CONSTRAINT "SupplierEvaluation_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcontractor" ADD CONSTRAINT "Subcontractor_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAcknowledgment" ADD CONSTRAINT "DocumentAcknowledgment_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagementReview" ADD CONSTRAINT "ManagementReview_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskItem" ADD CONSTRAINT "RiskItem_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityObjective" ADD CONSTRAINT "QualityObjective_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprovementSuggestion" ADD CONSTRAINT "ImprovementSuggestion_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionPolicy" ADD CONSTRAINT "RetentionPolicy_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

