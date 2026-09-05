-- CreateEnum
CREATE TYPE "TnVedRegulationCategory" AS ENUM ('SERTIFIKAT', 'DEKLARATSIYA');

-- CreateTable
CREATE TABLE "TnVedRegulation" (
    "id" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "nameUz" TEXT NOT NULL,
    "tnVedRaw" TEXT NOT NULL,
    "category" "TnVedRegulationCategory" NOT NULL,
    "decision" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TnVedRegulation_pkey" PRIMARY KEY ("id")
);
