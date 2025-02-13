import { Global, Module } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { HashingService } from './services/hashing.service';
import { TokenService } from './services/token.service';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard';
import { APIKeyGuard } from 'src/shared/guards/api-key.guard';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { MailService } from 'src/shared/services/mail.service';

@Global()
@Module({
  providers: [
    PrismaService,
    HashingService,
    TokenService,
    AccessTokenGuard,
    APIKeyGuard,
    MailService,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
  ],
  exports: [PrismaService, HashingService, TokenService, MailService],
  imports: [JwtModule],
})
export class SharedModule {}
