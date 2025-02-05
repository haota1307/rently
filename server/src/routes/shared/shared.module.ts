import { Global, Module } from '@nestjs/common';
import { HashingService } from 'src/routes/shared/services/hashing.service';
import { PrismaService } from 'src/routes/shared/services/prisma.service';

@Global()
@Module({
  providers: [PrismaService, HashingService],
  exports: [PrismaService, HashingService],
})
export class SharedModule {}
