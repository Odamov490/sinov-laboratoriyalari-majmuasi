-- CreateEnum
CREATE TYPE "SampleStatus" AS ENUM ('LABORATORIYADA', 'TASHILMOQDA', 'YAKUNLANDI');

-- CreateEnum
CREATE TYPE "MovementAction" AS ENUM ('REGISTRATSIYA', 'CHIQARISH', 'QABUL_QILISH', 'YAKUNLASH');

-- CreateTable
CREATE TABLE "Sample" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "description" TEXT,
    "originLabId" TEXT NOT NULL,
    "currentLabId" TEXT,
    "status" "SampleStatus" NOT NULL DEFAULT 'LABORATORIYADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Sample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SampleMovement" (
    "id" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "fromLabId" TEXT,
    "toLabId" TEXT,
    "action" "MovementAction" NOT NULL,
    "performedByUserId" TEXT,
    "performedByName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SampleMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sample_code_key" ON "Sample"("code");

-- AddForeignKey
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_originLabId_fkey" FOREIGN KEY ("originLabId") REFERENCES "Laboratory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_currentLabId_fkey" FOREIGN KEY ("currentLabId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleMovement" ADD CONSTRAINT "SampleMovement_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleMovement" ADD CONSTRAINT "SampleMovement_fromLabId_fkey" FOREIGN KEY ("fromLabId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleMovement" ADD CONSTRAINT "SampleMovement_toLabId_fkey" FOREIGN KEY ("toLabId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleMovement" ADD CONSTRAINT "SampleMovement_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;