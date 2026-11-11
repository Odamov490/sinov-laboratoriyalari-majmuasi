-- SMK formalari: fayl shablonlari olib tashlandi (Word/PDF tizimda yasaladi), hujjat shapkasi qo'shildi.
-- AlterTable
ALTER TABLE "SmkForm" DROP COLUMN "templateName",
DROP COLUMN "templateUrl",
DROP COLUMN "templateVersion",
ADD COLUMN     "header" JSONB NOT NULL DEFAULT '{}';

