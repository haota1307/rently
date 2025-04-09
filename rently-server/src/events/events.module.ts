import { Module } from '@nestjs/common'
import { EventsGateway } from './events.gateway'
import { SharedModule } from 'src/shared/shared.module'

@Module({
  imports: [SharedModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
