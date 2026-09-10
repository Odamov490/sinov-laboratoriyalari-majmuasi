-- Extend "Staff" with fields for a future full HR profile (personnel
-- number/code from the official tabel, hire/birth dates, passport and
-- PINFL, address, free-text notes). All nullable -- most staff records
-- won't have this data yet, and it is intentionally never exposed by
-- the public API (see getStaff's explicit `select`).
ALTER TABLE "Staff"
  ADD COLUMN "staffNumber" INTEGER,
  ADD COLUMN "employeeCode" TEXT,
  ADD COLUMN "hireDate" TIMESTAMP(3),
  ADD COLUMN "birthDate" TIMESTAMP(3),
  ADD COLUMN "passportSeries" TEXT,
  ADD COLUMN "passportNumber" TEXT,
  ADD COLUMN "pinfl" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "notes" TEXT;
