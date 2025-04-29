import {
  Controller,
  Post,
  Body,
  Request,
  Get,
  Query,
  Param,
} from '@nestjs/common'
import { PaymentService } from './payment.service'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { Auth, IsPublic } from 'src/shared/decorators/auth.decorator'
import {
  CreatePaymentDTO,
  GenerateQrDTO,
  WebhookPaymentBodyDTO,
  CheckPaymentStatusDTO,
  GetTransactionParamsDTO,
  GetTransactionDetailDTO,
  MessageResponseDTO,
  CreatePaymentResponseDTO,
  GenerateQrResponseDTO,
  CheckPaymentStatusResponseDTO,
  GetTransactionsResponseDTO,
  CountTransactionsResponseDTO,
  GetTransactionDetailResponseDTO,
  GetBankInfoResponseDTO,
  TransactionSummaryResponseDTO,
} from 'src/routes/payment/payment.dto'
import { AuthType } from 'src/shared/constants/auth.constant'
import { EventsGateway } from 'src/events/events.gateway'

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly eventsGateway: EventsGateway
  ) {}

  @Post('/receiver')
  @ZodSerializerDto(MessageResponseDTO)
  @Auth([AuthType.APIKey])
  receiver(@Body() body: WebhookPaymentBodyDTO) {
    return this.paymentService.receiver(body)
  }

  @Post('/create')
  @ZodSerializerDto(CreatePaymentResponseDTO)
  @IsPublic()
  async createPaymentRequest(@Body() body: CreatePaymentDTO) {
    return this.paymentService.createPaymentRequest(
      body.userId,
      body.amount,
      body.description
    )
  }

  @Get('/qrcode')
  @ZodSerializerDto(GenerateQrResponseDTO)
  @IsPublic()
  async generateQrCode(@Query() query: GenerateQrDTO) {
    return this.paymentService.generateQrCode(query.paymentId)
  }

  @Get('/status/:id')
  @ZodSerializerDto(CheckPaymentStatusResponseDTO)
  @IsPublic()
  async checkPaymentStatus(@Param() params: CheckPaymentStatusDTO) {
    const payment = await this.paymentService.checkPaymentStatus(params.id)
    return payment
  }

  @Get('/transactions')
  @ZodSerializerDto(GetTransactionsResponseDTO)
  @IsPublic()
  async getTransactions(@Query() query: GetTransactionParamsDTO) {
    return this.paymentService.getTransactions(query)
  }

  @Get('/transactions/count')
  @ZodSerializerDto(CountTransactionsResponseDTO)
  @IsPublic()
  async countTransactions(@Query() query: GetTransactionParamsDTO) {
    return this.paymentService.countTransactions(query)
  }

  @Get('/transactions/summary')
  @ZodSerializerDto(TransactionSummaryResponseDTO)
  @IsPublic()
  async getTransactionSummary(@Query() query: GetTransactionParamsDTO) {
    return this.paymentService.getTransactionSummary(query)
  }

  @Get('/transactions/:id')
  @ZodSerializerDto(GetTransactionDetailResponseDTO)
  @IsPublic()
  async getTransactionDetail(@Param() params: GetTransactionDetailDTO) {
    return this.paymentService.getTransactionDetail(params.id)
  }

  @Get('/bank-info')
  @ZodSerializerDto(GetBankInfoResponseDTO)
  @IsPublic()
  async getBankInfo() {
    return this.paymentService.getBankInfo()
  }
}
