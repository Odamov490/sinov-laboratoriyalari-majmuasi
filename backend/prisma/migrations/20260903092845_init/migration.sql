-- DropForeignKey
ALTER TABLE "SampleMovement" DROP CONSTRAINT "SampleMovement_sampleId_fkey";

-- AddForeignKey
ALTER TABLE "SampleMovement" ADD CONSTRAINT "SampleMovement_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
