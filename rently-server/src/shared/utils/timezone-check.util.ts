import { Logger } from '@nestjs/common'

/**
 * Kiểm tra và hiển thị thông tin múi giờ hiện tại của ứng dụng
 */
export function checkTimezone() {
  const logger = new Logger('TimezoneCheck')

  try {
    // Hiển thị múi giờ hệ thống
    const systemTimezone =
      process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone
    logger.log(`Múi giờ hệ thống: ${systemTimezone}`)

    // Hiển thị thời gian hiện tại theo múi giờ UTC
    const nowUtc = new Date()
    logger.log(`Thời gian hiện tại (UTC): ${nowUtc.toISOString()}`)

    // Hiển thị thời gian hiện tại theo múi giờ địa phương
    const localTime = new Date().toLocaleString('vi-VN', {
      timeZone: systemTimezone,
    })
    logger.log(`Thời gian hiện tại (local): ${localTime}`)

    // Hiển thị thời gian hiện tại theo múi giờ Việt Nam
    const vietnamTime = new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
    })
    logger.log(`Thời gian hiện tại (Việt Nam): ${vietnamTime}`)

    return {
      systemTimezone,
      utcTime: nowUtc.toISOString(),
      localTime,
      vietnamTime,
    }
  } catch (error) {
    logger.error(`Lỗi khi kiểm tra múi giờ: ${error.message}`)
    throw error
  }
}

export default {
  check: checkTimezone,
}
