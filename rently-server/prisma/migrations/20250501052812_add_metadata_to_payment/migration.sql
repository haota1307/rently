-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "RentalPost" ADD COLUMN     "deposit" DECIMAL(65,30) NOT NULL DEFAULT 0;
