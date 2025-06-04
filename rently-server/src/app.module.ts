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
import { RoomModule } from 'src/routes/room/room.module'
import { ChatbotModule } from 'src/routes/chatbot/chatbot.module'
import { StatisticsModule } from 'src/routes/statistics/statistics.module'
import { RoleUpgradeRequestModule } from 'src/routes/role-upgrade-request/role-upgrade-request.module'
import { FavoriteModule } from 'src/routes/favorite/favorite.module'
import { CommentModule } from 'src/routes/comment/comment.module'
import { EventsModule } from './events/events.module'
import { ViewingScheduleModule } from 'src/routes/viewing-schedule/viewing-schedule.module'
import { MessagesModule } from './routes/messages/messages.module'
import { RentalRequestModule } from 'src/routes/rental-request/rental-request.module'
import { PaymentModule } from './routes/payment/payment.module'
import { NotificationModule } from './routes/notification/notification.module'
import { PostReportModule } from './routes/post-report/post-report.module'
import { SystemSettingModule } from './routes/system-setting/system-setting.module'
import { ContactModule } from './routes/contact/contact.module'
import { RentalContractModule } from './routes/rental-contract/rental-contract.module'

import { AmenityModule } from 'src/routes/amenity/amenity.module'
import { ScheduleModule } from '@nestjs/schedule'
import { BullModule } from '@nestjs/bullmq'
import envConfig from 'src/shared/config'
import { PaymentConsumer } from 'src/routes/queues/payment.consumer'
import { RoomBillModule } from './routes/room-bill/room-bill.module'
import { LandlordSubscriptionModule } from './routes/landlord-subscription/landlord-subscription.module'

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: envConfig.REDIS_URL,
      },
    }),
    SharedModule,
    AuthModule,
    PermissionModule,
    RoleModule,
    ProfileModule,
    UserModule,
    UploadModule,
    PostModule,
    RentalModule,
    RoomModule,
    ChatbotModule,
    AmenityModule,
    StatisticsModule,
    RoleUpgradeRequestModule,
    FavoriteModule,
    CommentModule,
    EventsModule,
    ViewingScheduleModule,
    MessagesModule,
    RentalRequestModule,
    PaymentModule,
    NotificationModule,
    PostReportModule,
    SystemSettingModule,
    ContactModule,
    RentalContractModule,
    RoomBillModule,
    LandlordSubscriptionModule,
    ScheduleModule.forRoot(),
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
    PaymentConsumer,
  ],
})
export class AppModule {}
