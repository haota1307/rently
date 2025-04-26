import { Controller, Post, Body, Request } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { Auth, IsPublic } from 'src/shared/decorators/auth.decorator'
import { WebhookPaymentBodyDTO } from 'src/routes/payment/payment.dto'
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { AuthType } from 'src/shared/constants/auth.constant'

// DTO cho yêu cầu tạo thanh toán
export class CreatePaymentDTO extends createZodDto(
  z.object({
    userId: z.number().int().positive('ID người dùng phải là số nguyên dương'),
    amount: z.number().min(1000, 'Số tiền tối thiểu là 1.000 VND'),
    description: z.string().optional(),
  })
) {}

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

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
}
