import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { NotificationService } from './notification.service'
import {
  GetNotificationsQueryDTO,
  GetNotificationsResDTO,
  MarkAsReadParamsDTO,
  NotificationDTO,
} from './notification.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { ActiveUserData } from 'src/shared/interfaces/active-user-data.interface'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ZodSerializerDto(GetNotificationsResDTO)
  list(
    @ActiveUser() user: ActiveUserData,
    @Query() query: GetNotificationsQueryDTO
  ) {
    return this.notificationService.list(user.userId, query)
  }

  @Get('unread-count')
  async getUnreadCount(@ActiveUser() user: ActiveUserData) {
    const count = await this.notificationService.getUnreadCount(user.userId)
    return { count }
  }

  @Patch(':notificationId/read')
  @ZodSerializerDto(NotificationDTO)
  markAsRead(
    @Param() params: MarkAsReadParamsDTO,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.notificationService.markAsRead(params.notificationId)
  }

  @Patch('read-all')
  @ZodSerializerDto(MessageResDTO)
  markAllAsRead(@ActiveUser() user: ActiveUserData) {
    return this.notificationService.markAllAsRead(user.userId)
  }
}
