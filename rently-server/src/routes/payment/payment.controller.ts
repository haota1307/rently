import {
  Controller,
  Post,
  Body,
  Request,
  Get,
  Query,
  Param,
  Put,
  BadRequestException,
} from '@nestjs/common'
import { PaymentService } from './payment.service'
import { ZodSerializerDto } from 'nestjs-zod'
import { Auth, IsPublic } from 'src/shared/decorators/auth.decorator'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
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
  WithdrawRequestDTO,
  WithdrawRequestResponseDTO,
  UpdateWithdrawRequestDTO,
  UpdateWithdrawRequestResponseDTO,
  GenerateWithdrawQrDTO,
  GenerateWithdrawQrResponseDTO,
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

  @Get('/withdraw-qrcode')
  @ZodSerializerDto(GenerateWithdrawQrResponseDTO)
  @IsPublic()
  async generateWithdrawQrCode(@Query() query: GenerateWithdrawQrDTO) {
    return this.paymentService.generateWithdrawQrCode(query.withdrawId)
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
  async getTransactions(
    @Query() query: GetTransactionParamsDTO,
    @ActiveUser('userId') currentUserId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    // Nếu tham số current=true được gửi lên, sử dụng ID người dùng hiện tại
    if (query.current === true) {
      query.userId = currentUserId
    }

    // Nếu là admin và không có tham số current, cho phép xem tất cả hoặc lọc theo userId
    if (roleName !== 'ADMIN' && !query.userId) {
      query.userId = currentUserId
    }

    return this.paymentService.getTransactions(query)
  }

  @Get('/transactions/count')
  @ZodSerializerDto(CountTransactionsResponseDTO)
  async countTransactions(
    @Query() query: GetTransactionParamsDTO,
    @ActiveUser('userId') currentUserId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    // Xử lý giống như getTransactions
    if (query.current === true) {
      query.userId = currentUserId
    }

    if (roleName !== 'ADMIN' && !query.userId) {
      query.userId = currentUserId
    }

    return this.paymentService.countTransactions(query)
  }

  @Get('/transactions/summary')
  @ZodSerializerDto(TransactionSummaryResponseDTO)
  async getTransactionSummary(
    @Query() query: GetTransactionParamsDTO,
    @ActiveUser('userId') currentUserId: number,
    @ActiveUser('roleName') roleName: string
  ) {
    // Xử lý giống như getTransactions
    if (query.current === true) {
      query.userId = currentUserId
    }

    if (roleName !== 'ADMIN' && !query.userId) {
      query.userId = currentUserId
    }

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

  @Post('/withdraw')
  @ZodSerializerDto(WithdrawRequestResponseDTO)
  @IsPublic()
  async createWithdrawRequest(@Body() body: WithdrawRequestDTO) {
    return this.paymentService.createWithdrawRequest(
      body.userId,
      body.amount,
      body.bankName,
      body.bankAccountNumber,
      body.bankAccountName,
      body.description
    )
  }

  @Put('/withdraw/:id')
  @ZodSerializerDto(UpdateWithdrawRequestResponseDTO)
  @IsPublic()
  async processWithdrawRequest(
    @Param('id') id: string,
    @Body() body: UpdateWithdrawRequestDTO
  ) {
    return this.paymentService.processWithdrawRequest(
      parseInt(id, 10),
      body.status,
      body.rejectionReason
    )
  }

  @Post('/withdraw-confirm')
  @ZodSerializerDto(MessageResponseDTO)
  @Auth([AuthType.APIKey])
  async confirmWithdrawTransaction(@Body() body: WebhookPaymentBodyDTO) {
    // Kiểm tra nội dung và lấy ID giao dịch rút tiền
    const withdrawIdMatch = body.content?.match(/#RUT(\d+)/)
    if (!withdrawIdMatch || !withdrawIdMatch[1]) {
      throw new BadRequestException(
        'Không tìm thấy mã giao dịch rút tiền trong nội dung chuyển khoản'
      )
    }
    const withdrawId = parseInt(withdrawIdMatch[1], 10)

    // Gọi service để xử lý xác nhận rút tiền
    const result = await this.paymentService.confirmWithdrawTransaction(
      withdrawId,
      body
    )

    return result
  }
}
