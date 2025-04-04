import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { SharedModule } from 'src/shared/shared.module'
import { AuthModule } from 'src/routes/auth/auth.module'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import CustomZodValidationPipe from 'src/shared/pipes/custom-zod-validation.pipe'
import { HttpExceptionFilter } from 'src/shared/filters/http-exception.filter'
import { PermissionModule } from 'src/routes/permission/permission.module'
import { RoleModule } from 'src/routes/role/role.module'
import { ProfileModule } from 'src/routes/profile/profile.module'
import { UserModule } from 'src/routes/user/user.module'
import { UploadModule } from 'src/routes/upload/upload.module'
import { PostModule } from 'src/routes/post/post.module'
import { RentalModule } from 'src/routes/rental/rental.module'
import { AddressModule } from 'src/routes/address/address.module'
import { RoomModule } from 'src/routes/room/room.module'
import { ChatbotModule } from 'src/routes/chatbot/chatbot.module'
import { AmenityModule } from 'src/routes/amenity/amenity.module'
import { StatisticsModule } from 'src/routes/statistics/statistics.module'

@Module({
  imports: [
    SharedModule,
    AuthModule,
    PermissionModule,
    RoleModule,
    ProfileModule,
    UserModule,
    UploadModule,
    PostModule,
    RentalModule,
    AddressModule,
    RoomModule,
    ChatbotModule,
    AmenityModule,
    StatisticsModule,
  ],
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
