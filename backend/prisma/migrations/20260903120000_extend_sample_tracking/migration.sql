-- AlterTable
ALTER TABLE "Sample" ADD COLUMN "dueDate" TIMESTAMP(3);
ALTER TABLE "Sample" ADD COLUMN "applicationId" TEXT;
ALTER TABLE "Sample" ADD COLUMN "photoUrl" TEXT;
ALTER TABLE "Sample" ADD COLUMN "reportUrl" TEXT;

-- AddForeignKey
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;