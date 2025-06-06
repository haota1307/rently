-- Xóa ràng buộc khóa ngoại cũ nếu có
ALTER TABLE "SubscriptionHistory" DROP CONSTRAINT IF EXISTS "SubscriptionHistory_paymentId_fkey";

-- Thêm ràng buộc khóa ngoại mới
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_paymentTransactionId_fkey" FOREIGN KEY ("paymentId") REFERENCES "PaymentTransaction"("id") ON DELETE SET NULL; 