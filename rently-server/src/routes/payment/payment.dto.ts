import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

import {
  CreatePaymentSchema,
  GenerateQrSchema,
  WebhookPaymentBodySchema,
  CheckPaymentStatusSchema,
  GetTransactionParamsSchema,
  GetTransactionDetailSchema,
  MessageResponseSchema,
  CreatePaymentResponseSchema,
  GenerateQrResponseSchema,
  CheckPaymentStatusResponseSchema,
  GetTransactionsResponseSchema,
  CountTransactionsResponseSchema,
  GetTransactionDetailResponseSchema,
  BankInfoSchema,
  SepayBankAccountDetailsSchema,
  SepayBankAccountResponseSchema,
  TransactionSummarySchema,
  WithdrawRequestSchema,
  WithdrawRequestResponseSchema,
  UpdateWithdrawRequestSchema,
  UpdateWithdrawRequestResponseSchema,
  GenerateWithdrawQrSchema,
  GenerateWithdrawQrResponseSchema,
} from 'src/routes/payment/payment.model'

// Request DTOs
export class WebhookPaymentBodyDTO extends createZodDto(
  WebhookPaymentBodySchema
) {}

export class GenerateQrDTO extends createZodDto(GenerateQrSchema) {}

export class GenerateWithdrawQrDTO extends createZodDto(
  GenerateWithdrawQrSchema
) {}

export class CreatePaymentDTO extends createZodDto(CreatePaymentSchema) {}

export class CheckPaymentStatusDTO extends createZodDto(
  CheckPaymentStatusSchema
) {}

export class GetTransactionParamsDTO extends createZodDto(
  GetTransactionParamsSchema
) {}

export class GetTransactionDetailDTO extends createZodDto(
  GetTransactionDetailSchema
) {}

export class WithdrawRequestDTO extends createZodDto(WithdrawRequestSchema) {}

export class UpdateWithdrawRequestDTO extends createZodDto(
  UpdateWithdrawRequestSchema
) {}

// Response DTOs
export class MessageResponseDTO extends createZodDto(MessageResponseSchema) {}

export class CreatePaymentResponseDTO extends createZodDto(
  CreatePaymentResponseSchema
) {}

export class GenerateQrResponseDTO extends createZodDto(
  GenerateQrResponseSchema
) {}

export class CheckPaymentStatusResponseDTO extends createZodDto(
  CheckPaymentStatusResponseSchema
) {}

export class GetTransactionsResponseDTO extends createZodDto(
  GetTransactionsResponseSchema
) {}

export class CountTransactionsResponseDTO extends createZodDto(
  CountTransactionsResponseSchema
) {}

export class GetTransactionDetailResponseDTO extends createZodDto(
  GetTransactionDetailResponseSchema
) {}

export class BankInfoDTO extends createZodDto(BankInfoSchema) {}

export class SepayBankAccountDetailsDTO extends createZodDto(
  SepayBankAccountDetailsSchema
) {}

export class SepayBankAccountResponseDTO extends createZodDto(
  SepayBankAccountResponseSchema
) {}

export class WithdrawRequestResponseDTO extends createZodDto(
  WithdrawRequestResponseSchema
) {}

export class UpdateWithdrawRequestResponseDTO extends createZodDto(
  UpdateWithdrawRequestResponseSchema
) {}

// Định nghĩa lại response của getBankInfo
export const GetBankInfoResponseSchema = z.object({
  status: z.number(),
  error: z.null(),
  messages: z.object({
    success: z.boolean(),
  }),
  bankInfo: BankInfoSchema,
})

export class GetBankInfoResponseDTO extends createZodDto(
  GetBankInfoResponseSchema
) {}

// Định nghĩa response cho thống kê giao dịch
export class TransactionSummaryResponseDTO extends createZodDto(
  TransactionSummarySchema
) {}

// DTO cho tạo mã QR rút tiền
export class GenerateWithdrawQrResponseDTO extends createZodDto(
  GenerateWithdrawQrResponseSchema
) {}
