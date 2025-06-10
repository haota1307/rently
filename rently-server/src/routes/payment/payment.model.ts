import { z } from 'zod'

export const PaymentTransactionSchema = z.object({
  id: z.number(),
  gateway: z.string(),
  transactionDate: z.date(),
  accountNumber: z.string().nullable(),
  subAccount: z.string().nullable(),
  amountIn: z.number(),
  amountOut: z.number(),
  accumulated: z.number(),
  code: z.string().nullable(),
  transactionContent: z.string().nullable(),
  referenceNumber: z.string().nullable(),
  body: z.string().nullable(),
  createdAt: z.date(),
})

export const WebhookPaymentBodySchema = z.object({
  id: z.number(), // ID giao dịch trên SePay
  gateway: z.string(), // Brand name của ngân hàng
  transactionDate: z.string(), // Thời gian xảy ra giao dịch phía ngân hàng
  accountNumber: z.string().nullable(), // Số tài khoản ngân hàng
  code: z.string().nullable(), // Mã code thanh toán (sepay tự nhận diện dựa vào cấu hình tại Công ty -> Cấu hình chung)
  content: z.string().nullable(), // Nội dung chuyển khoản
  transferType: z.enum(['in', 'out']), // Loại giao dịch. in là tiền vào, out là tiền ra
  transferAmount: z.number(), // Số tiền giao dịch
  accumulated: z.number(), // Số dư tài khoản (lũy kế)
  subAccount: z.string().nullable(), // Tài khoản ngân hàng phụ (tài khoản định danh),
  referenceCode: z.string().nullable(), // Mã tham chiếu của tin nhắn sms
  description: z.string(), // Toàn bộ nội dung tin nhắn sms
})

export const GenerateQrSchema = z.object({
  paymentId: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0, {
      message: 'ID thanh toán phải là số nguyên dương',
    }),
})

export const CreatePaymentSchema = z.object({
  userId: z.number().int().positive('ID người dùng phải là số nguyên dương'),
  amount: z.number().min(1000, 'Số tiền tối thiểu là 1.000 VND'),
  description: z.string().optional(),
})

export const CheckPaymentStatusSchema = z.object({
  id: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0, {
      message: 'ID thanh toán phải là số nguyên dương',
    }),
})

export const GetTransactionParamsSchema = z.object({
  userId: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : undefined))
    .refine(val => val === undefined || (!isNaN(val) && val > 0), {
      message: 'ID người dùng phải là số nguyên dương',
    }),
  current: z
    .string()
    .optional()
    .transform(val => val === 'true' || val === '1'),
  transaction_date_min: z.string().optional(),
  transaction_date_max: z.string().optional(),
  since_id: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 20))
    .refine(val => val === undefined || (!isNaN(val) && val > 0), {
      message: 'Limit phải là số nguyên dương',
    }),
  reference_number: z.string().optional(),
  amount_in: z.string().optional(),
  amount_out: z.string().optional(),
  transaction_content: z.string().optional(),
  status: z.string().optional(),
})

export const GetTransactionDetailSchema = z.object({
  id: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0, {
      message: 'ID giao dịch phải là số nguyên dương',
    }),
})

// Response schemas
export const MessageResponseSchema = z.object({
  message: z.string(),
  paymentId: z.number().optional(),
})

export const CreatePaymentResponseSchema = z.object({
  paymentCode: z.string(),
  payment: z.object({
    id: z.number(),
    amount: z.number(),
    status: z.string(),
    description: z.string().nullable(),
    userId: z.number(),
    transactionId: z.number().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    user: z
      .object({
        id: z.number(),
        name: z.string(),
        email: z.string(),
        // Các trường khác của user có thể thêm vào đây
      })
      .optional(),
  }),
})

export const GenerateQrResponseSchema = z.object({
  qrCodeUrl: z.string(),
  paymentCode: z.string(),
  amount: z.number(),
  bankInfo: z.object({
    bankName: z.string(),
    accountNumber: z.string(),
    accountName: z.string(),
  }),
})

export const GenerateWithdrawQrResponseSchema = z.object({
  status: z.number(),
  error: z.null(),
  messages: z.object({
    success: z.boolean(),
  }),
  qrCodeData: z.object({
    qrCodeUrl: z.string(),
    withdrawId: z.number(),
    amount: z.number(),
    transferContent: z.string(),
    recipientInfo: z.object({
      bankName: z.string(),
      bankAccountNumber: z.string(),
      bankAccountName: z.string(),
    }),
  }),
})

export const CheckPaymentStatusResponseSchema = z.object({
  id: z.number(),
  status: z.string(),
  amount: z.number(),
  description: z.string().nullable(),
  userId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const TransactionItemSchema = z.object({
  id: z.string(),
  bank_brand_name: z.string(),
  account_number: z.string(),
  transaction_date: z.string(),
  amount_out: z.string(),
  amount_in: z.string(),
  accumulated: z.string(),
  transaction_content: z.string().nullable(),
  reference_number: z.string().nullable(),
  code: z.string().nullable(),
  sub_account: z.string().nullable(),
  bank_account_id: z.string(),
  status: z.string(),
  user: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      phoneNumber: z.string(),
    })
    .optional(),
})

export const GetTransactionsResponseSchema = z.object({
  status: z.number(),
  error: z.null(),
  messages: z.object({
    success: z.boolean(),
  }),
  transactions: z.array(TransactionItemSchema),
})

export const CountTransactionsResponseSchema = z.object({
  status: z.number(),
  error: z.null(),
  messages: z.object({
    success: z.boolean(),
  }),
  count_transactions: z.number(),
})

export const GetTransactionDetailResponseSchema = z.object({
  status: z.number(),
  error: z.null(),
  messages: z.object({
    success: z.boolean(),
  }),
  transaction: z.object({
    id: z.string(),
    bank_brand_name: z.string(),
    account_number: z.string(),
    transaction_date: z.string(),
    amount_out: z.string(),
    amount_in: z.string(),
    accumulated: z.string(),
    transaction_content: z.string().nullable(),
    reference_number: z.string().nullable(),
    code: z.string().nullable(),
    sub_account: z.string().nullable(),
    bank_account_id: z.string(),
  }),
})

// Thêm schema cho response của API SePay BankAccountDetails
export const SepayBankAccountDetailsSchema = z.object({
  id: z.string(),
  account_holder_name: z.string(),
  account_number: z.string(),
  accumulated: z.string(),
  last_transaction: z.string(),
  label: z.string(),
  active: z.string(),
  created_at: z.string(),
  bank_short_name: z.string(),
  bank_full_name: z.string(),
  bank_bin: z.string(),
  bank_code: z.string(),
})

export const SepayBankAccountResponseSchema = z.object({
  status: z.number(),
  error: z.null(),
  messages: z.object({
    success: z.boolean(),
  }),
  bankaccount: SepayBankAccountDetailsSchema,
})

// Cập nhật BankInfoSchema để phù hợp với dữ liệu SePay
export const BankInfoSchema = z.object({
  id: z.string(),
  bankName: z.string(),
  bankFullName: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
  accumulated: z.string(),
  lastTransaction: z.string(),
  label: z.string(),
})

// Schema cho response thống kê giao dịch
export const TransactionSummarySchema = z.object({
  status: z.number(),
  error: z.null(),
  messages: z.object({
    success: z.boolean(),
  }),
  summary: z.object({
    totalIncome: z.number(),
    totalExpense: z.number(),
    balance: z.number(),
  }),
})

// Thêm schema cho yêu cầu rút tiền
export const WithdrawRequestSchema = z.object({
  userId: z.number().int().positive('ID người dùng phải là số nguyên dương'),
  amount: z.number().min(10000, 'Số tiền tối thiểu rút là 10.000 VND'),
  bankName: z.string().min(2, 'Tên ngân hàng không được để trống'),
  bankAccountNumber: z.string().min(5, 'Số tài khoản không hợp lệ'),
  bankAccountName: z.string().min(2, 'Tên chủ tài khoản không được để trống'),
  description: z.string().optional(),
})

// Response schema cho yêu cầu rút tiền
export const WithdrawRequestResponseSchema = z.object({
  status: z.number(),
  error: z.null(),
  messages: z.object({
    success: z.boolean(),
  }),
  withdrawRequest: z.object({
    id: z.number(),
    amount: z.number(),
    status: z.string(),
    description: z.string().nullable(),
    userId: z.number(),
    bankName: z.string(),
    bankAccountNumber: z.string(),
    bankAccountName: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
})

// Schema cho cập nhật trạng thái yêu cầu rút tiền (dành cho admin)
export const UpdateWithdrawRequestSchema = z.object({
  status: z.enum(['COMPLETED', 'REJECTED']),
  rejectionReason: z.string().optional(),
})

// Response schema cho cập nhật yêu cầu rút tiền
export const UpdateWithdrawRequestResponseSchema = MessageResponseSchema

export const GenerateWithdrawQrSchema = z.object({
  withdrawId: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0, {
      message: 'ID yêu cầu rút tiền phải là số nguyên dương',
    }),
})

export type PaymentTransactionType = z.infer<typeof PaymentTransactionSchema>
export type WebhookPaymentBodyType = z.infer<typeof WebhookPaymentBodySchema>
export type GenerateQrType = z.infer<typeof GenerateQrSchema>
export type CreatePaymentType = z.infer<typeof CreatePaymentSchema>
export type CheckPaymentStatusType = z.infer<typeof CheckPaymentStatusSchema>
export type GetTransactionParamsType = z.infer<
  typeof GetTransactionParamsSchema
>
export type GetTransactionDetailType = z.infer<
  typeof GetTransactionDetailSchema
>

export type MessageResponseType = z.infer<typeof MessageResponseSchema>
export type CreatePaymentResponseType = z.infer<
  typeof CreatePaymentResponseSchema
>
export type GenerateQrResponseType = z.infer<typeof GenerateQrResponseSchema>
export type CheckPaymentStatusResponseType = z.infer<
  typeof CheckPaymentStatusResponseSchema
>
export type GetTransactionsResponseType = z.infer<
  typeof GetTransactionsResponseSchema
>
export type CountTransactionsResponseType = z.infer<
  typeof CountTransactionsResponseSchema
>
export type GetTransactionDetailResponseType = z.infer<
  typeof GetTransactionDetailResponseSchema
>

export type SepayBankAccountDetailsType = z.infer<
  typeof SepayBankAccountDetailsSchema
>
export type SepayBankAccountResponseType = z.infer<
  typeof SepayBankAccountResponseSchema
>

// Export types
export type WithdrawRequestType = z.infer<typeof WithdrawRequestSchema>
export type WithdrawRequestResponseType = z.infer<
  typeof WithdrawRequestResponseSchema
>
export type UpdateWithdrawRequestType = z.infer<
  typeof UpdateWithdrawRequestSchema
>
export type UpdateWithdrawRequestResponseType = z.infer<
  typeof UpdateWithdrawRequestResponseSchema
>
