import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import timezoneConfig from './shared/config/timezone.config'
import timezoneCheck from './shared/utils/timezone-check.util'

async function bootstrap() {
  // Cấu hình múi giờ trước khi khởi tạo ứng dụng
  timezoneConfig.configure()

  // Kiểm tra múi giờ sau khi cấu hình
  timezoneCheck.check()

  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
