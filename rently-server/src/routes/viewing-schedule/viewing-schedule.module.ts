import { Module } from '@nestjs/common'
import { ViewingScheduleController } from './viewing-schedule.controller'
import { ViewingScheduleService } from './viewing-schedule.service'
import { ViewingScheduleRepo } from './viewing-schedule.repo'

@Module({
  controllers: [ViewingScheduleController],
  providers: [ViewingScheduleService, ViewingScheduleRepo],
})
export class ViewingScheduleModule {}
