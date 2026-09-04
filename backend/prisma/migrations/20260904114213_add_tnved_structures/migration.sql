-- CreateEnum
CREATE TYPE "TnVedInquiryStatus" AS ENUM ('YANGI', 'BOGLANILDI', 'ARIZAGA_AYLANDI');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "productDescription" TEXT,
ADD COLUMN     "tnVedCode" TEXT,
ADD COLUMN     "tnVedCodeId" TEXT;

-- CreateTable
CREATE TABLE "TnVedCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameUz" TEXT NOT NULL,
    "nameRu" TEXT,
    "nameEn" TEXT,
    "laboratoryId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TnVedCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TnVedInquiry" (
    "id" TEXT NOT NULL,
    "tnVedCode" TEXT NOT NULL,
    "tnVedCodeId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "status" "TnVedInquiryStatus" NOT NULL DEFAULT 'YANGI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TnVedInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationTestItem" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "addedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationTestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ServiceToTnVedCode" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TnVedCode_code_key" ON "TnVedCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "_ServiceToTnVedCode_AB_unique" ON "_ServiceToTnVedCode"("A", "B");

-- CreateIndex
CREATE INDEX "_ServiceToTnVedCode_B_index" ON "_ServiceToTnVedCode"("B");

-- AddForeignKey
ALTER TABLE "TnVedCode" ADD CONSTRAINT "TnVedCode_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TnVedInquiry" ADD CONSTRAINT "TnVedInquiry_tnVedCodeId_fkey" FOREIGN KEY ("tnVedCodeId") REFERENCES "TnVedCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_tnVedCodeId_fkey" FOREIGN KEY ("tnVedCodeId") REFERENCES "TnVedCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationTestItem" ADD CONSTRAINT "ApplicationTestItem_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationTestItem" ADD CONSTRAINT "ApplicationTestItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationTestItem" ADD CONSTRAINT "ApplicationTestItem_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceToTnVedCode" ADD CONSTRAINT "_ServiceToTnVedCode_A_fkey" FOREIGN KEY ("A") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceToTnVedCode" ADD CONSTRAINT "_ServiceToTnVedCode_B_fkey" FOREIGN KEY ("B") REFERENCES "TnVedCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
