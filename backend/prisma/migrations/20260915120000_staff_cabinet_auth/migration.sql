-- Staff self-service cabinet: passport-series+number + PINFL login, plus
-- an audit trail so a Super Admin can oversee each staff member's own
-- account activity (logins and profile edits).
CREATE TYPE "StaffActivityAction" AS ENUM ('LOGIN', 'LOGIN_FAILED', 'PROFILE_UPDATE');

ALTER TABLE "Staff" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

CREATE TABLE "StaffActivityLog" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "action" "StaffActivityAction" NOT NULL,
    "detail" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StaffActivityLog_staffId_idx" ON "StaffActivityLog"("staffId");

ALTER TABLE "StaffActivityLog" ADD CONSTRAINT "StaffActivityLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
