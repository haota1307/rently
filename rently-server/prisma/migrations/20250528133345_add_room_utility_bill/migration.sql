-- CreateTable
CREATE TABLE "RoomUtilityBill" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "electricityOld" INTEGER NOT NULL DEFAULT 0,
    "electricityNew" INTEGER NOT NULL DEFAULT 0,
    "electricityPrice" DECIMAL(65,30) NOT NULL DEFAULT 3500,
    "waterOld" INTEGER NOT NULL DEFAULT 0,
    "waterNew" INTEGER NOT NULL DEFAULT 0,
    "waterPrice" DECIMAL(65,30) NOT NULL DEFAULT 15000,
    "otherFees" JSONB,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "billingMonth" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdById" INTEGER NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RoomUtilityBill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomUtilityBill_roomId_idx" ON "RoomUtilityBill"("roomId");

-- CreateIndex
CREATE INDEX "RoomUtilityBill_billingMonth_idx" ON "RoomUtilityBill"("billingMonth");

-- CreateIndex
CREATE INDEX "RoomUtilityBill_isPaid_idx" ON "RoomUtilityBill"("isPaid");

-- AddForeignKey
ALTER TABLE "RoomUtilityBill" ADD CONSTRAINT "RoomUtilityBill_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomUtilityBill" ADD CONSTRAINT "RoomUtilityBill_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
