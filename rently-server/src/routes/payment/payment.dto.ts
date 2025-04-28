import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

import {
  CreatePaymentSchema,
  GenerateQrSchema,
  WebhookPaymentBodySchema,
} from 'src/routes/payment/payment.model'

export class WebhookPaymentBodyDTO extends createZodDto(
  WebhookPaymentBodySchema
) {}

export class GenerateQrDTO extends createZodDto(GenerateQrSchema) {}

export class CreatePaymentDTO extends createZodDto(CreatePaymentSchema) {}
