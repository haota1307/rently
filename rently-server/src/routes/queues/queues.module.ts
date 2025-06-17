import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { EmailConsumer } from './email.consumer'
import { SharedModule } from 'src/shared/shared.module'
import envConfig from 'src/shared/config'

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: envConfig.REDIS_URL,
      },
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
    SharedModule,
  ],
  providers: [EmailConsumer],
  exports: [BullModule],
})
export class QueuesModule {}
