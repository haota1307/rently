-- CreateEnum
CREATE TYPE "RoleUpgradeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "RoleUpgradeRequest" (
    "id" SERIAL NOT NULL,
    "status" "RoleUpgradeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "processedById" INTEGER,

    CONSTRAINT "RoleUpgradeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoleUpgradeRequest_userId_idx" ON "RoleUpgradeRequest"("userId");

-- CreateIndex
CREATE INDEX "RoleUpgradeRequest_status_idx" ON "RoleUpgradeRequest"("status");

-- CreateIndex
CREATE INDEX "RoleUpgradeRequest_createdAt_idx" ON "RoleUpgradeRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "RoleUpgradeRequest" ADD CONSTRAINT "RoleUpgradeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleUpgradeRequest" ADD CONSTRAINT "RoleUpgradeRequest_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
