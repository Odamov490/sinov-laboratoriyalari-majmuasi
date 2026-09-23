-- CreateEnum
CREATE TYPE "NonConformanceSource" AS ENUM ('AUDIT', 'SHIKOYAT', 'ICHKI_KUZATUV', 'NAMUNA_MUAMMOSI');

-- CreateEnum
CREATE TYPE "NonConformanceStatus" AS ENUM ('OCHIQ', 'JARAYONDA', 'YOPILDI', 'TASDIQLANDI');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('QABUL_QILINDI', 'TEKSHIRILMOQDA', 'HAL_QILINDI');

-- CreateTable
CREATE TABLE "NonConformance" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "source" "NonConformanceSource" NOT NULL,
    "description" TEXT NOT NULL,
    "detectedDate" TIMESTAMP(3) NOT NULL,
    "responsibleUserId" TEXT,
    "rootCauseAnalysis" TEXT,
    "correctiveAction" TEXT,
    "dueDate" TIMESTAMP(3),
    "closedDate" TIMESTAMP(3),
    "status" "NonConformanceStatus" NOT NULL DEFAULT 'OCHIQ',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NonConformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "relatedApplicationId" TEXT,
    "description" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "investigationNotes" TEXT,
    "resolution" TEXT,
    "responsibleUserId" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'QABUL_QILINDI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NonConformance_code_key" ON "NonConformance"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_code_key" ON "Complaint"("code");

-- AddForeignKey
ALTER TABLE "NonConformance" ADD CONSTRAINT "NonConformance_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_relatedApplicationId_fkey" FOREIGN KEY ("relatedApplicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
