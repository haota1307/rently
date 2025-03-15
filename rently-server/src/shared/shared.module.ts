import { Global, Module } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { HashingService } from './services/hashing.service'
import { TokenService } from './services/token.service'
import { JwtModule } from '@nestjs/jwt'
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard'
import { APIKeyGuard } from 'src/shared/guards/api-key.guard'
import { APP_GUARD } from '@nestjs/core'
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { EmailService } from 'src/shared/services/email.service'

@Global()
@Module({
  providers: [
    PrismaService,
    HashingService,
    TokenService,
    AccessTokenGuard,
    APIKeyGuard,
    SharedUserRepository,
    EmailService,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
  ],
  exports: [
    PrismaService,
    HashingService,
    TokenService,
    SharedUserRepository,
    EmailService,
  ],
  imports: [JwtModule],
})
export class SharedModule {}
