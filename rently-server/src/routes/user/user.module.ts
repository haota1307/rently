import { Module } from '@nestjs/common'
import { UserController } from 'src/routes/user/user.controller'
import { UserRepo } from 'src/routes/user/user.repo'
import { UserService } from 'src/routes/user/user.service'
import { EventsModule } from 'src/events/events.module'

@Module({
  imports: [EventsModule],
  providers: [UserService, UserRepo],
  controllers: [UserController],
})
export class UserModule {}
