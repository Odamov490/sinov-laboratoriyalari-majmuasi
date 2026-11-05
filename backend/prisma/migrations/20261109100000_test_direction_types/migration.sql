-- Sinov yo'nalishlari: enum o'rniga spravochnik (yangi yo'nalish qo'shish uchun).
-- Mavjud yozuvlar o'zgarmaydi: enum qiymatlari xuddi shu matn kodlariga aylanadi.

-- CreateTable
CREATE TABLE "TestDirectionType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "short" TEXT NOT NULL,
    "nameUz" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestDirectionType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TestDirectionType_code_key" ON "TestDirectionType"("code");

-- Mavjud 4 ta yo'nalish
INSERT INTO "TestDirectionType" ("id", "code", "short", "nameUz", "order", "isActive", "updatedAt") VALUES
    ('7d2f3c1e-0001-4a00-8000-000000000001', 'XAVFSIZLIK', 'BZ', 'Xavfsizlik (BZ)', 1, true, CURRENT_TIMESTAMP),
    ('7d2f3c1e-0002-4a00-8000-000000000002', 'EMC', 'EMM', 'Elektromagnit moslashuvchanlik (EMM)', 2, true, CURRENT_TIMESTAMP),
    ('7d2f3c1e-0003-4a00-8000-000000000003', 'ENERGIYA', 'EE', 'Energiya samaradorligi (EE)', 3, true, CURRENT_TIMESTAMP),
    ('7d2f3c1e-0004-4a00-8000-000000000004', 'SHOVQIN', 'Shovqin', 'Shovqin darajasi', 4, true, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- AlterTable: enum -> matn (qiymatlar saqlanadi)
ALTER TABLE "TestJournalRecord" ALTER COLUMN "directions" TYPE TEXT[] USING "directions"::TEXT[];
ALTER TABLE "TestJournalPrice" ALTER COLUMN "direction" TYPE TEXT USING "direction"::TEXT;

-- DropEnum
DROP TYPE "TestDirection";
