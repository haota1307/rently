import { Module } from '@nestjs/common'
import { MessagesController } from './messages.controller'
import { MessagesService } from './messages.service'
import { MessagesRepo } from './messages.repo'
import { EventsModule } from 'src/events/events.module'
import { UploadModule } from 'src/routes/upload/upload.module'

@Module({
  imports: [EventsModule, UploadModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesRepo],
  exports: [MessagesService, MessagesRepo],
})
export class MessagesModule {}
