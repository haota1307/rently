import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from 'src/routes/auth/auth.module';
import { SharedModule } from 'src/routes/shared/shared.module';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [AuthModule, SharedModule],
  controllers: [AppController],
  providers: [
    AppService,
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: ClassSerializerInterceptor, // Kích hoạt ClassSerializerInterceptor để chuyển đổi và định dạng dữ liệu trả về từ controller.
    // },
  ],
})
export class AppModule {}
