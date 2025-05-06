import { Module } from '@nestjs/common'
import { ViewingScheduleController } from './viewing-schedule.controller'
import { ViewingScheduleService } from './viewing-schedule.service'
import { ViewingScheduleRepo } from './viewing-schedule.repo'
import { NotificationModule } from 'src/routes/notification/notification.module'

@Module({
  controllers: [ViewingScheduleController],
  providers: [ViewingScheduleService, ViewingScheduleRepo],
  imports: [NotificationModule],
})
export class ViewingScheduleModule {}
