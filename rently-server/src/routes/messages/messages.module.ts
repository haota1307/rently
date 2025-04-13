import { Module } from '@nestjs/common'
import { MessagesController } from './messages.controller'
import { MessagesService } from './messages.service'
import { MessagesRepo } from './messages.repo'
import { EventsModule } from '../../events/events.module'

@Module({
  imports: [EventsModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesRepo],
  exports: [MessagesService, MessagesRepo],
})
export class MessagesModule {}
