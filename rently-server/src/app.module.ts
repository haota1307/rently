import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from 'src/shared/shared.module';
import { AuthModule } from 'src/routes/auth/auth.module';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import CustomZodValidationPipe from 'src/shared/pipes/custom-zod-validation.pipe';
import { HttpExceptionFilter } from 'src/shared/filters/http-exception.filter';
import { UsersModule } from 'src/routes/users/users.module';
import { PermissionModule } from 'src/routes/permission/permission.module';

@Module({
  imports: [SharedModule, AuthModule, UsersModule, PermissionModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: CustomZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
