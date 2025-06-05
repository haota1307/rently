-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELED');

-- CreateTable
CREATE TABLE "LandlordSubscription" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "planType" TEXT NOT NULL DEFAULT 'BASIC',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMPTZ(6) NOT NULL,
    "endDate" TIMESTAMPTZ(6) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isFreeTrial" BOOLEAN NOT NULL DEFAULT false,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "LandlordSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionHistory" (
    "id" SERIAL NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "previousStatus" "SubscriptionStatus",
    "newStatus" "SubscriptionStatus",
    "amount" DECIMAL(10,2),
    "paymentId" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LandlordSubscription_userId_status_key" ON "LandlordSubscription"("userId", "status") WHERE "status" = 'ACTIVE';

-- CreateIndex
CREATE INDEX "LandlordSubscription_userId_idx" ON "LandlordSubscription"("userId");

-- CreateIndex
CREATE INDEX "LandlordSubscription_status_idx" ON "LandlordSubscription"("status");

-- CreateIndex
CREATE INDEX "LandlordSubscription_endDate_idx" ON "LandlordSubscription"("endDate");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_subscriptionId_idx" ON "SubscriptionHistory"("subscriptionId");

-- AddForeignKey
ALTER TABLE "LandlordSubscription" ADD CONSTRAINT "LandlordSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "LandlordSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE; 