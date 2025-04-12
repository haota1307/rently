/*
  Warnings:

  - Made the column `requireTenantConfirmation` on table `ViewingSchedule` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ViewingSchedule" ALTER COLUMN "requireTenantConfirmation" SET NOT NULL;
