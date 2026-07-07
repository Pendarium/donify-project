-- CreateTable
CREATE TABLE "FavoriteOffer" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,

    CONSTRAINT "FavoriteOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerHistoryEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "userId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,

    CONSTRAINT "VolunteerHistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteOffer_userId_offerId_key" ON "FavoriteOffer"("userId", "offerId");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerHistoryEntry_userId_offerId_key" ON "VolunteerHistoryEntry"("userId", "offerId");

-- AddForeignKey
ALTER TABLE "FavoriteOffer" ADD CONSTRAINT "FavoriteOffer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteOffer" ADD CONSTRAINT "FavoriteOffer_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "VolunteerOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerHistoryEntry" ADD CONSTRAINT "VolunteerHistoryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerHistoryEntry" ADD CONSTRAINT "VolunteerHistoryEntry_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "VolunteerOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
