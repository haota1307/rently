import { Module } from '@nestjs/common'
import { NotificationController } from 'src/routes/notification/notification.controller'
import { NotificationGateway } from 'src/routes/notification/notification.gateway'
import { NotificationRepo } from 'src/routes/notification/notification.repo'
import { NotificationService } from 'src/routes/notification/notification.service'

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepo, NotificationGateway],
  exports: [NotificationService],
})
export class NotificationModule {}
