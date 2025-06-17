import { Module } from '@nestjs/common'
import { ContactService } from './contact.service'
import { ContactController } from './contact.controller'
import { ContactRepository } from './contact.repo'
import { SharedModule } from 'src/shared/shared.module'
import { BullModule } from '@nestjs/bullmq'

@Module({
  imports: [
    SharedModule,
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  controllers: [ContactController],
  providers: [ContactService, ContactRepository],
  exports: [ContactService],
})
export class ContactModule {}
