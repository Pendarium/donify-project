-- DropIndex
DROP INDEX "VolunteerHistoryEntry_userId_offerId_key";

-- CreateIndex
CREATE INDEX "VolunteerHistoryEntry_userId_offerId_idx" ON "VolunteerHistoryEntry"("userId", "offerId");
