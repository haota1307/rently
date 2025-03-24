/*
  Warnings:

  - Added the required column `order` to the `RentalImage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Rental" ADD COLUMN     "distance" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "RentalImage" ADD COLUMN     "order" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "RentalImage_order_idx" ON "RentalImage"("order");
