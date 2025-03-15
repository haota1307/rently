import { Module } from '@nestjs/common'

import { UsersController } from 'src/routes/users/users.controller'
import { UsersRepository } from 'src/routes/users/users.repo'
import { UsersService } from 'src/routes/users/users.service'

@Module({
  providers: [UsersService, UsersRepository],
  controllers: [UsersController],
})
export class UsersModule {}
