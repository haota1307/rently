import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from 'src/routes/auth/auth.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UsersModule } from 'src/routes/users/users.module';

@Module({
  imports: [SharedModule, AuthModule, UsersModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor, // Kích hoạt ClassSerializerInterceptor để chuyển đổi và định dạng dữ liệu trả về từ controller.
    },
  ],
})
export class AppModule {}
