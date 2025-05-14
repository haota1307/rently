import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { ServerOptions } from 'socket.io'
import { Logger } from '@nestjs/common'

// Custom IoAdapter để cấu hình Socket.io
class CustomIoAdapter extends IoAdapter {
  private readonly logger = new Logger('CustomIoAdapter')

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
      },
      // Giới hạn kích thước package để tránh tràn bộ nhớ
      maxHttpBufferSize: 1e6, // 1MB
      // Cấu hình ping timeout để đóng kết nối không sử dụng
      pingTimeout: 60000, // 60 giây
      // Cấu hình ping interval để kiểm tra kết nối
      pingInterval: 25000, // 25 giây
      // Cấu hình đóng kết nối khi client không phản hồi
      connectTimeout: 45000, // 45 giây
      // Cấu hình tự động đóng kết nối
      transports: ['websocket', 'polling'],
    })

    server.engine.on('connection_error', err => {
      this.logger.error(`Socket.io connection error: ${err.message}`)
    })

    this.logger.log('Socket.io server initialized with memory optimizations')

    return server
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const logger = new Logger('Bootstrap')

  // Sử dụng custom adapter cho WebSocket
  app.useWebSocketAdapter(new CustomIoAdapter(app))

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })

  // Thêm global interceptor để xử lý lỗi
  app.enableShutdownHooks()

  const port = process.env.PORT ?? 3000
  await app.listen(port)
  logger.log(`Application is running on port ${port}`)
}
bootstrap()
