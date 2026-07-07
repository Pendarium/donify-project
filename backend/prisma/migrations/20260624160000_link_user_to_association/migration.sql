-- AlterTable
ALTER TABLE "User" ADD COLUMN "associationId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddUnique
ALTER TABLE "User" ADD CONSTRAINT "User_associationId_key" UNIQUE ("associationId");
