import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

// Query parameters for transactions listing
export const GetTransactionsQuerySchema = z.object({
  account_number: z.string().optional(),
  transaction_date_min: z.string().optional(),
  transaction_date_max: z.string().optional(),
  since_id: z.string().optional(),
  limit: z.string().optional(),
  reference_number: z.string().optional(),
  amount_in: z.string().optional(),
  amount_out: z.string().optional(),
})

export class GetTransactionsQueryDTO extends createZodDto(
  GetTransactionsQuerySchema
) {}

// Response structure for a single transaction
export const TransactionSchema = z.object({
  id: z.string(),
  bank_brand_name: z.string().optional(),
  account_number: z.string(),
  transaction_date: z.string(),
  amount_out: z.string(),
  amount_in: z.string(),
  accumulated: z.string(),
  transaction_content: z.string().nullable(),
  reference_number: z.string().nullable(),
  code: z.string().nullable(),
  sub_account: z.string().nullable(),
  bank_account_id: z.string().optional(),
})

// Response for get transaction details
export const GetTransactionDetailResSchema = z.object({
  status: z.number(),
  error: z.any().nullable(),
  messages: z.object({
    success: z.boolean(),
  }),
  transaction: TransactionSchema,
})

export class GetTransactionDetailResDTO extends createZodDto(
  GetTransactionDetailResSchema
) {}

// Response for list transactions
export const GetTransactionsResSchema = z.object({
  status: z.number(),
  error: z.any().nullable(),
  messages: z.object({
    success: z.boolean(),
  }),
  transactions: z.array(TransactionSchema),
})

export class GetTransactionsResDTO extends createZodDto(
  GetTransactionsResSchema
) {}

// Response for count transactions
export const CountTransactionsResSchema = z.object({
  status: z.number(),
  error: z.any().nullable(),
  messages: z.object({
    success: z.boolean(),
  }),
  count_transactions: z.number(),
})

export class CountTransactionsResDTO extends createZodDto(
  CountTransactionsResSchema
) {}
