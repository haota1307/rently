/*
  Warnings:

  - Added the required column `backImage` to the `RoleUpgradeRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `frontImage` to the `RoleUpgradeRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RoleUpgradeRequest" ADD COLUMN     "backImage" TEXT NOT NULL,
ADD COLUMN     "frontImage" TEXT NOT NULL;
