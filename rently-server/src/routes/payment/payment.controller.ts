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
  @ZodSerializerDto(MessageResDTO)
  @Auth([AuthType.APIKey])
  receiver(@Body() body: WebhookPaymentBodyDTO) {
    return this.paymentService.receiver(body)
  }

  @Post('/create')
  @IsPublic()
  async createPaymentRequest(@Body() body: CreatePaymentDTO) {
    return this.paymentService.createPaymentRequest(
      body.userId,
      body.amount,
      body.description
    )
  }

  @Get('/qrcode')
  @IsPublic()
  async generateQrCode(@Query() query: GenerateQrDTO) {
    return this.paymentService.generateQrCode(query.paymentId)
  }

  @Get('/status/:id')
  @IsPublic()
  async checkPaymentStatus(@Param('id') id: string) {
    const payment = await this.paymentService.checkPaymentStatus(
      parseInt(id, 10)
    )

    return payment
  }

  @Get('/transactions')
  @IsPublic()
  async getTransactions(@Query() query: any) {
    return this.paymentService.getTransactions(query)
  }

  @Get('/transactions/count')
  @IsPublic()
  async countTransactions(@Query() query: any) {
    return this.paymentService.countTransactions(query)
  }

  @Get('/transactions/:id')
  @IsPublic()
  async getTransactionDetail(@Param('id') id: string) {
    return this.paymentService.getTransactionDetail(parseInt(id, 10))
  }
}
