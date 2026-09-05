/*
  Warnings:

  - You are about to drop the column `tnVedCodeId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `tnVedCodeId` on the `TnVedInquiry` table. All the data in the column will be lost.
  - You are about to drop the `TnVedCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ServiceToTnVedCode` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_tnVedCodeId_fkey";

-- DropForeignKey
ALTER TABLE "TnVedCode" DROP CONSTRAINT "TnVedCode_laboratoryId_fkey";

-- DropForeignKey
ALTER TABLE "TnVedInquiry" DROP CONSTRAINT "TnVedInquiry_tnVedCodeId_fkey";

-- DropForeignKey
ALTER TABLE "_ServiceToTnVedCode" DROP CONSTRAINT "_ServiceToTnVedCode_A_fkey";

-- DropForeignKey
ALTER TABLE "_ServiceToTnVedCode" DROP CONSTRAINT "_ServiceToTnVedCode_B_fkey";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "tnVedCodeId";

-- AlterTable
ALTER TABLE "TnVedInquiry" DROP COLUMN "tnVedCodeId";

-- DropTable
DROP TABLE "TnVedCode";

-- DropTable
DROP TABLE "_ServiceToTnVedCode";
