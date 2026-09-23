-- CreateEnum
CREATE TYPE "SMKDocumentCategory" AS ENUM ('PROTSEDURA', 'KORSATMA', 'FORMA', 'JURNAL');

-- CreateEnum
CREATE TYPE "SMKDocumentStatus" AS ENUM ('AMALDA', 'QORALAMA', 'BEKOR_QILINGAN');

-- CreateEnum
CREATE TYPE "InternalAuditStatus" AS ENUM ('REJALASHTIRILGAN', 'OTKAZILDI', 'YAKUNLANDI');

-- CreateEnum
CREATE TYPE "AuditFindingSeverity" AS ENUM ('KATTA', 'KICHIK', 'KUZATUV');

-- CreateEnum
CREATE TYPE "ProficiencyResultStatus" AS ENUM ('QONIQARLI', 'QONIQARSIZ', 'OGOHLANTIRISH');

-- CreateEnum
CREATE TYPE "MethodValidationStatus" AS ENUM ('TASDIQLANGAN', 'JARAYONDA');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('FAOL', 'NAZORAT_OSTIDA', 'YOPILDI');

-- CreateEnum
CREATE TYPE "QualityObjectiveStatus" AS ENUM ('BAJARILMOQDA', 'BAJARILDI', 'BAJARILMADI');

-- CreateEnum
CREATE TYPE "ImprovementSuggestionStatus" AS ENUM ('KORIB_CHIQILMOQDA', 'QABUL_QILINDI', 'RAD_ETILDI');

-- CreateTable
CREATE TABLE "SMKDocument" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "titleUz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "category" "SMKDocumentCategory" NOT NULL,
    "ownerUserId" TEXT,
    "status" "SMKDocumentStatus" NOT NULL DEFAULT 'QORALAMA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMKDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SMKDocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" TEXT NOT NULL,
    "fileUrl" TEXT,
    "changeDescription" TEXT,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SMKDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalAudit" (
    "id" TEXT NOT NULL,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "actualDate" TIMESTAMP(3),
    "laboratoryId" TEXT,
    "auditorUserId" TEXT,
    "status" "InternalAuditStatus" NOT NULL DEFAULT 'REJALASHTIRILGAN',
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditFinding" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "AuditFindingSeverity" NOT NULL,
    "linkedNonConformanceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalibrationRecord" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "calibrationDate" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "certificateUrl" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalibrationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trainingTitle" TEXT NOT NULL,
    "trainingDate" TIMESTAMP(3) NOT NULL,
    "provider" TEXT,
    "certificateUrl" TEXT,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityControlRecord" (
    "id" TEXT NOT NULL,
    "laboratoryId" TEXT,
    "testType" TEXT NOT NULL,
    "controlDate" TIMESTAMP(3) NOT NULL,
    "expectedValue" TEXT,
    "actualValue" TEXT,
    "deviation" TEXT,
    "withinLimits" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityControlRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProficiencyTest" (
    "id" TEXT NOT NULL,
    "laboratoryId" TEXT,
    "testProgram" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL,
    "resultStatus" "ProficiencyResultStatus" NOT NULL,
    "reportUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProficiencyTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasurementUncertainty" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT,
    "testMethodName" TEXT,
    "uncertaintyValue" TEXT NOT NULL,
    "unit" TEXT,
    "calculationMethod" TEXT,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeasurementUncertainty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MethodValidation" (
    "id" TEXT NOT NULL,
    "methodName" TEXT NOT NULL,
    "standardReference" TEXT,
    "validationDate" TIMESTAMP(3) NOT NULL,
    "validatedBy" TEXT,
    "reportUrl" TEXT,
    "status" "MethodValidationStatus" NOT NULL DEFAULT 'JARAYONDA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MethodValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpartialityDeclaration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "declarationYear" INTEGER NOT NULL,
    "signedDate" TIMESTAMP(3) NOT NULL,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpartialityDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierEvaluation" (
    "id" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "category" TEXT,
    "evaluationDate" TIMESTAMP(3) NOT NULL,
    "score" INTEGER NOT NULL,
    "notes" TEXT,
    "nextEvaluationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcontractor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accreditationInfo" TEXT,
    "servicesProvided" TEXT,
    "contractUrl" TEXT,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subcontractor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvironmentLog" (
    "id" TEXT NOT NULL,
    "laboratoryId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "withinLimits" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnvironmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentAcknowledgment" (
    "id" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentAcknowledgment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagementReview" (
    "id" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "participants" TEXT,
    "agendaItems" TEXT,
    "decisions" TEXT,
    "nextReviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManagementReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskItem" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "likelihood" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "mitigationPlan" TEXT,
    "ownerUserId" TEXT,
    "status" "RiskStatus" NOT NULL DEFAULT 'FAOL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityObjective" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "objectiveText" TEXT NOT NULL,
    "targetValue" TEXT,
    "actualValue" TEXT,
    "status" "QualityObjectiveStatus" NOT NULL DEFAULT 'BAJARILMOQDA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualityObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImprovementSuggestion" (
    "id" TEXT NOT NULL,
    "submittedByUserId" TEXT,
    "description" TEXT NOT NULL,
    "submittedDate" TIMESTAMP(3) NOT NULL,
    "status" "ImprovementSuggestionStatus" NOT NULL DEFAULT 'KORIB_CHIQILMOQDA',
    "implementationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImprovementSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetentionPolicy" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "retentionYears" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SMKDocument_code_key" ON "SMKDocument"("code");

-- AddForeignKey
ALTER TABLE "SMKDocument" ADD CONSTRAINT "SMKDocument_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMKDocumentVersion" ADD CONSTRAINT "SMKDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "SMKDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMKDocumentVersion" ADD CONSTRAINT "SMKDocumentVersion_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalAudit" ADD CONSTRAINT "InternalAudit_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalAudit" ADD CONSTRAINT "InternalAudit_auditorUserId_fkey" FOREIGN KEY ("auditorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "InternalAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_linkedNonConformanceId_fkey" FOREIGN KEY ("linkedNonConformanceId") REFERENCES "NonConformance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationRecord" ADD CONSTRAINT "CalibrationRecord_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingRecord" ADD CONSTRAINT "TrainingRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityControlRecord" ADD CONSTRAINT "QualityControlRecord_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProficiencyTest" ADD CONSTRAINT "ProficiencyTest_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementUncertainty" ADD CONSTRAINT "MeasurementUncertainty_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpartialityDeclaration" ADD CONSTRAINT "ImpartialityDeclaration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvironmentLog" ADD CONSTRAINT "EnvironmentLog_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAcknowledgment" ADD CONSTRAINT "DocumentAcknowledgment_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "SMKDocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentAcknowledgment" ADD CONSTRAINT "DocumentAcknowledgment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskItem" ADD CONSTRAINT "RiskItem_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprovementSuggestion" ADD CONSTRAINT "ImprovementSuggestion_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
