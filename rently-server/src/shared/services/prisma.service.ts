import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    let url = process.env.DATABASE_URL || ''

    // Thêm tham số timezone vào cuối URL nếu URL tồn tại
    if (url) {
      url += (url.includes('?') ? '&' : '?') + 'timezone=Asia/Ho_Chi_Minh'
    }

    super({
      log: ['info'],
      // Cấu hình xử lý múi giờ cho cơ sở dữ liệu
      datasources: {
        db: {
          url,
        },
      },
    })
  }

  async onModuleInit() {
    this.logger.log('Kết nối đến cơ sở dữ liệu với múi giờ Việt Nam (GMT+7)')
    await this.$connect()
  }
}
