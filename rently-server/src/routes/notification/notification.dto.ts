import { createZodDto } from 'nestjs-zod'
import {
  NotificationSchema,
  GetNotificationsQuerySchema,
  GetNotificationsResSchema,
  CreateNotificationBodySchema,
  MarkAsReadParamsSchema,
} from './notification.schema'

// DTOs
export class NotificationDTO extends createZodDto(NotificationSchema) {}
export class GetNotificationsQueryDTO extends createZodDto(
  GetNotificationsQuerySchema
) {}
export class GetNotificationsResDTO extends createZodDto(
  GetNotificationsResSchema
) {}
export class CreateNotificationBodyDTO extends createZodDto(
  CreateNotificationBodySchema
) {}
export class MarkAsReadParamsDTO extends createZodDto(MarkAsReadParamsSchema) {}
