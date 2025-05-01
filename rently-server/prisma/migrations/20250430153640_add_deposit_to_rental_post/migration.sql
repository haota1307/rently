-- AlterTable
ALTER TABLE "RentalPost" ADD COLUMN "deposit" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- Nếu depositAmount đã tồn tại và requireDeposit = true, chuyển giá trị sang deposit
UPDATE "RentalPost" SET "deposit" = "depositAmount" WHERE "requireDeposit" = true AND "depositAmount" IS NOT NULL;

-- Xóa các trường cũ sau khi đã chuyển dữ liệu
ALTER TABLE "RentalPost" DROP COLUMN IF EXISTS "requireDeposit";
ALTER TABLE "RentalPost" DROP COLUMN IF EXISTS "depositAmount"; 