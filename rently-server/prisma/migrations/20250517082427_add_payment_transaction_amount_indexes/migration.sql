-- CreateIndex
CREATE INDEX "PaymentTransaction_amountIn_idx" ON "PaymentTransaction"("amountIn");

-- CreateIndex
CREATE INDEX "PaymentTransaction_amountOut_idx" ON "PaymentTransaction"("amountOut");

-- CreateIndex
CREATE INDEX "PaymentTransaction_transactionContent_amountIn_idx" ON "PaymentTransaction"("transactionContent", "amountIn");

-- CreateIndex
CREATE INDEX "PaymentTransaction_transactionContent_amountOut_idx" ON "PaymentTransaction"("transactionContent", "amountOut");

-- CreateIndex
CREATE INDEX "PaymentTransaction_transactionDate_amountIn_idx" ON "PaymentTransaction"("transactionDate", "amountIn");

-- CreateIndex
CREATE INDEX "PaymentTransaction_transactionDate_amountOut_idx" ON "PaymentTransaction"("transactionDate", "amountOut");

-- Thêm index cho cột amountIn trong bảng PaymentTransaction
CREATE INDEX "payment_transaction_amount_in_idx" ON "PaymentTransaction" ("amountIn");

-- Thêm index cho cột amountOut trong bảng PaymentTransaction
CREATE INDEX "payment_transaction_amount_out_idx" ON "PaymentTransaction" ("amountOut");

-- Thêm index composite cho amountIn và transactionContent để tối ưu truy vấn nạp tiền
CREATE INDEX "payment_transaction_deposit_idx" ON "PaymentTransaction" ("amountIn", "transactionContent") WHERE "amountIn" > 0;

-- Thêm index composite cho amountOut và transactionContent để tối ưu truy vấn rút tiền
CREATE INDEX "payment_transaction_withdraw_idx" ON "PaymentTransaction" ("amountOut", "transactionContent") WHERE "amountOut" > 0;
