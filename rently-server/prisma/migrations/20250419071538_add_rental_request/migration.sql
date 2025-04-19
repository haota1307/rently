-- CreateEnum
CREATE TYPE "RentalRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED');

-- CreateTable
CREATE TABLE "RentalRequest" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "landlordId" INTEGER NOT NULL,
    "status" "RentalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "expectedMoveDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "depositAmount" DECIMAL(65,30),
    "contractSigned" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RentalRequest_postId_idx" ON "RentalRequest"("postId");

-- CreateIndex
CREATE INDEX "RentalRequest_tenantId_idx" ON "RentalRequest"("tenantId");

-- CreateIndex
CREATE INDEX "RentalRequest_landlordId_idx" ON "RentalRequest"("landlordId");

-- CreateIndex
CREATE INDEX "RentalRequest_status_idx" ON "RentalRequest"("status");

-- CreateIndex
CREATE INDEX "RentalRequest_createdAt_idx" ON "RentalRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "RentalRequest" ADD CONSTRAINT "RentalRequest_postId_fkey" FOREIGN KEY ("postId") REFERENCES "RentalPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalRequest" ADD CONSTRAINT "RentalRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalRequest" ADD CONSTRAINT "RentalRequest_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
