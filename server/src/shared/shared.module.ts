import { JwtModule } from '@nestjs/jwt';
import { Global, Module } from '@nestjs/common';

import { TokenService } from 'src/shared/services/token.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { HashingService } from 'src/shared/services/hashing.service';

@Global()
@Module({
  providers: [PrismaService, HashingService, TokenService],
  exports: [PrismaService, HashingService, TokenService],
  imports: [JwtModule],
})
export class SharedModule {}
