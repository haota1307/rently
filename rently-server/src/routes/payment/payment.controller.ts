import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard'
import { PaymentService } from './payment.service'
import {
  CountTransactionsResDTO,
  GetTransactionDetailResDTO,
  GetTransactionsQueryDTO,
  GetTransactionsResDTO,
} from './payment.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'

@Controller('payments')
@UseGuards(AccessTokenGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // Get transaction details by ID
  @Get('transactions/:id')
  @ZodSerializerDto(GetTransactionDetailResDTO)
  async getTransactionDetails(
    @Param('id') id: string,
    @ActiveUser('userId') userId: number
  ) {
    // Only allow access for admin users
    return this.paymentService.getTransactionDetails(id)
  }

  // Get list of transactions with optional filters
  @Get('transactions')
  @ZodSerializerDto(GetTransactionsResDTO)
  async getTransactionsList(
    @Query() query: GetTransactionsQueryDTO,
    @ActiveUser('userId') userId: number
  ) {
    // Only allow access for admin users
    return this.paymentService.getTransactionsList(query)
  }

  // Count transactions with optional filters
  @Get('transactions/count')
  @ZodSerializerDto(CountTransactionsResDTO)
  async countTransactions(
    @Query() query: GetTransactionsQueryDTO,
    @ActiveUser('userId') userId: number
  ) {
    // Only allow access for admin users
    return this.paymentService.countTransactions(query)
  }
}
