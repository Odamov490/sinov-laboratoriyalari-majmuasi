-- AlterTable
ALTER TABLE "User" ADD COLUMN     "labId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Laboratory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
