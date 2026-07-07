-- AlterTable
ALTER TABLE "VolunteerOffer" ADD COLUMN     "durationHours" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "isUrgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "volunteersNeeded" INTEGER NOT NULL DEFAULT 1;
