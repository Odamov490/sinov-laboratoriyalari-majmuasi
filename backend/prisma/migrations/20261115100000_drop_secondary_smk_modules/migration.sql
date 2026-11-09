-- Ikkinchi darajali 12 ta SMK moduli olib tashlandi (Sifat bo'limida 10 ta asosiy modul qoldi).
-- DropForeignKey
ALTER TABLE "SMKDocumentVersion" DROP CONSTRAINT "SMKDocumentVersion_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "SMKDocumentVersion" DROP CONSTRAINT "SMKDocumentVersion_documentId_fkey";

-- DropForeignKey
ALTER TABLE "SMKDocumentVersion" DROP CONSTRAINT "SMKDocumentVersion_approvedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "AuditFinding" DROP CONSTRAINT "AuditFinding_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "AuditFinding" DROP CONSTRAINT "AuditFinding_auditId_fkey";

-- DropForeignKey
ALTER TABLE "AuditFinding" DROP CONSTRAINT "AuditFinding_linkedNonConformanceId_fkey";

-- DropForeignKey
ALTER TABLE "MethodValidation" DROP CONSTRAINT "MethodValidation_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "ImpartialityDeclaration" DROP CONSTRAINT "ImpartialityDeclaration_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "ImpartialityDeclaration" DROP CONSTRAINT "ImpartialityDeclaration_userId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierEvaluation" DROP CONSTRAINT "SupplierEvaluation_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "Subcontractor" DROP CONSTRAINT "Subcontractor_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "EnvironmentLog" DROP CONSTRAINT "EnvironmentLog_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentAcknowledgment" DROP CONSTRAINT "DocumentAcknowledgment_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentAcknowledgment" DROP CONSTRAINT "DocumentAcknowledgment_documentVersionId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentAcknowledgment" DROP CONSTRAINT "DocumentAcknowledgment_userId_fkey";

-- DropForeignKey
ALTER TABLE "ManagementReview" DROP CONSTRAINT "ManagementReview_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "QualityObjective" DROP CONSTRAINT "QualityObjective_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "ImprovementSuggestion" DROP CONSTRAINT "ImprovementSuggestion_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "ImprovementSuggestion" DROP CONSTRAINT "ImprovementSuggestion_submittedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "RetentionPolicy" DROP CONSTRAINT "RetentionPolicy_laboratoryId_fkey";

-- DropTable
DROP TABLE "SMKDocumentVersion";

-- DropTable
DROP TABLE "AuditFinding";

-- DropTable
DROP TABLE "MethodValidation";

-- DropTable
DROP TABLE "ImpartialityDeclaration";

-- DropTable
DROP TABLE "SupplierEvaluation";

-- DropTable
DROP TABLE "Subcontractor";

-- DropTable
DROP TABLE "EnvironmentLog";

-- DropTable
DROP TABLE "DocumentAcknowledgment";

-- DropTable
DROP TABLE "ManagementReview";

-- DropTable
DROP TABLE "QualityObjective";

-- DropTable
DROP TABLE "ImprovementSuggestion";

-- DropTable
DROP TABLE "RetentionPolicy";

-- DropEnum
DROP TYPE "AuditFindingSeverity";

-- DropEnum
DROP TYPE "MethodValidationStatus";

-- DropEnum
DROP TYPE "QualityObjectiveStatus";

-- DropEnum
DROP TYPE "ImprovementSuggestionStatus";

