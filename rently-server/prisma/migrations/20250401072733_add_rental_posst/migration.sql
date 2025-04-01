/*
  Warnings:

  - Added the required column `description` to the `RentalPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomId` to the `RentalPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `RentalPost` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RentalPostStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');

-- AlterTable
ALTER TABLE "RentalPost" ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "roomId" INTEGER NOT NULL,
ADD COLUMN     "status" "RentalPostStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "title" VARCHAR(250) NOT NULL;

-- AddForeignKey
ALTER TABLE "RentalPost" ADD CONSTRAINT "RentalPost_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
