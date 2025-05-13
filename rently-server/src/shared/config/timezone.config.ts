import { Logger } from '@nestjs/common'

/**
 * Cấu hình múi giờ cho ứng dụng
 */
export function configureTimezone() {
  const logger = new Logger('TimezoneConfig')

  try {
    // Thiết lập múi giờ mặc định là Việt Nam (GMT+7)
    process.env.TZ = 'Asia/Ho_Chi_Minh'
    logger.log(`Đã cấu hình múi giờ: ${process.env.TZ}`)

    // Kiểm tra xem cấu hình đã được áp dụng chưa
    const currentDate = new Date()
    logger.log(`Thời gian hiện tại: ${currentDate.toISOString()}`)
  } catch (error) {
    logger.error(`Lỗi khi cấu hình múi giờ: ${error.message}`)
  }
}

export default {
  configure: configureTimezone,
}
