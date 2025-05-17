-- CreateIndex
CREATE INDEX "Payment_status_userId_idx" ON "Payment"("status", "userId");

-- CreateIndex
CREATE INDEX "Payment_createdAt_status_idx" ON "Payment"("createdAt", "status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_transactionDate_transactionContent_idx" ON "PaymentTransaction"("transactionDate", "transactionContent");

-- CreateIndex
CREATE INDEX "PaymentTransaction_transactionDate_userId_transactionConten_idx" ON "PaymentTransaction"("transactionDate", "userId", "transactionContent");

-- CreateIndex
CREATE INDEX "PaymentTransaction_transactionContent_idx" ON "PaymentTransaction"("transactionContent");
