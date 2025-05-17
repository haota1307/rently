-- This is an empty migration.

-- Thêm index composite cho truy vấn doanh thu kết hợp ngày và loại giao dịch
CREATE INDEX "payment_transaction_date_content_idx" ON "PaymentTransaction" ("transactionDate", "transactionContent");

-- Thêm index cho trường tìm kiếm thường xuyên
CREATE INDEX "payment_transaction_content_idx" ON "PaymentTransaction" ("transactionContent");

-- Thêm index cho truy vấn theo userId + ngày + nội dung (cho bộ lọc người dùng)
CREATE INDEX "payment_transaction_user_date_content_idx" ON "PaymentTransaction" ("userId", "transactionDate", "transactionContent");

-- Thêm index cho Payment quan hệ với status (để lọc các giao dịch theo trạng thái)
CREATE INDEX "payment_status_idx" ON "Payment" ("status");

-- Thêm index theo trạng thái + ngày tạo (để lọc giao dịch theo thời gian)
CREATE INDEX "payment_created_status_idx" ON "Payment" ("createdAt", "status");