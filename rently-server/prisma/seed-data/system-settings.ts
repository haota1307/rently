import { PrismaClient } from '@prisma/client'

import * as fs from 'fs'
import * as path from 'path'
import {
  SYSTEM_SETTING_GROUPS,
  SYSTEM_SETTING_TYPES,
} from 'src/routes/system-setting/system-setting.model'

export async function seedSystemSettings(prisma: PrismaClient) {
  // Đọc template từ thư mục emails
  const emailsDir = path.join(process.cwd(), 'emails')

  // Template OTP
  let otpEmailTemplate = ''
  try {
    otpEmailTemplate = fs.readFileSync(path.join(emailsDir, 'otp.tsx'), 'utf-8')
  } catch (error) {
    console.error('Error reading OTP email template:', error)
    otpEmailTemplate = `<h1>Mã xác thực OTP</h1>
<p>Mã xác thực của bạn là: {{code}}</p>
<p>Trân trọng,</p>
<p>Đội ngũ Rently</p>`
  }

  // Template Viewing Reminder
  let viewingReminderTemplate = ''
  try {
    viewingReminderTemplate = fs.readFileSync(
      path.join(emailsDir, 'viewing-reminder.tsx'),
      'utf-8'
    )
  } catch (error) {
    console.error('Error reading Viewing Reminder template:', error)
    viewingReminderTemplate = `<h1>Nhắc lịch xem phòng</h1>
<p>Xin chào {{tenantName}},</p>
<p>Đây là lời nhắc về lịch hẹn xem phòng của bạn.</p>
<p>Trân trọng,</p>
<p>Đội ngũ Rently</p>`
  }

  // Template Rental Request
  let rentalRequestTemplate = ''
  try {
    rentalRequestTemplate = fs.readFileSync(
      path.join(emailsDir, 'rental-request.tsx'),
      'utf-8'
    )
  } catch (error) {
    console.error('Error reading Rental Request template:', error)
    rentalRequestTemplate = `<h1>Yêu cầu thuê mới</h1>
<p>Xin chào {{landlord_name}},</p>
<p>Bạn có một yêu cầu thuê mới từ {{tenant_name}} cho bài đăng "{{post_title}}".</p>
<p>Chi tiết yêu cầu:</p>
<ul>
  <li>Ngày bắt đầu thuê: {{start_date}}</li>
  <li>Thời hạn: {{duration}} tháng</li>
  <li>Ghi chú: {{note}}</li>
</ul>
<p>Vui lòng đăng nhập vào hệ thống để xem chi tiết và phản hồi yêu cầu.</p>
<p>Trân trọng,</p>
<p>Đội ngũ Rently</p>`
  }

  // Template Rental Status Update
  let rentalStatusUpdateTemplate = ''
  try {
    rentalStatusUpdateTemplate = fs.readFileSync(
      path.join(emailsDir, 'rental-status-update.tsx'),
      'utf-8'
    )
  } catch (error) {
    console.error('Error reading Rental Status Update template:', error)
    rentalStatusUpdateTemplate = `<h1>Cập nhật trạng thái yêu cầu thuê</h1>
<p>Xin chào {{receiver_name}},</p>
<p>Yêu cầu thuê của bạn cho tin đăng "{{post_title}}" {{status_message}} bởi {{sender_name}}.</p>
{{#if rejection_reason}}
<p>Lý do: {{rejection_reason}}</p>
{{/if}}
<p>Vui lòng đăng nhập vào hệ thống để xem chi tiết.</p>
<p>Trân trọng,</p>
<p>Đội ngũ Rently</p>`
  }

  // Cài đặt giao diện
  await prisma.systemSetting.upsert({
    where: { key: 'site_logo' },
    update: {},
    create: {
      key: 'site_logo',
      value: '/logo.svg',
      type: SYSTEM_SETTING_TYPES.STRING,
      group: SYSTEM_SETTING_GROUPS.INTERFACE,
      description: 'Logo của trang web',
    },
  })

  await prisma.systemSetting.upsert({
    where: { key: 'site_favicon' },
    update: {},
    create: {
      key: 'site_favicon',
      value: '/logo.svg',
      type: SYSTEM_SETTING_TYPES.STRING,
      group: SYSTEM_SETTING_GROUPS.INTERFACE,
      description: 'Favicon của trang web',
    },
  })

  // Mẫu email thông báo
  await prisma.systemSetting.upsert({
    where: { key: 'email_welcome_template' },
    update: {},
    create: {
      key: 'email_welcome_template',
      value: `<h1>Chào mừng đến với Rently!</h1>
<p>Xin chào {{user_name}},</p>
<p>Chúng tôi rất vui mừng khi bạn đã đăng ký làm thành viên của Rently - Nền tảng kết nối chủ trọ và người thuê.</p>
<p>Với Rently, bạn có thể:</p>
<ul>
  <li>Tìm kiếm phòng trọ phù hợp</li>
  <li>Đặt lịch xem phòng</li>
  <li>Quản lý yêu cầu thuê</li>
</ul>
<p>Hãy bắt đầu với việc hoàn thiện hồ sơ của bạn.</p>
<p>Trân trọng,</p>
<p>Đội ngũ Rently</p>`,
      type: SYSTEM_SETTING_TYPES.STRING,
      group: SYSTEM_SETTING_GROUPS.EMAIL,
      description: 'Mẫu email chào mừng',
    },
  })

  // Email OTP (cập nhật theo template trong thư mục emails)
  await prisma.systemSetting.upsert({
    where: { key: 'email_otp_template' },
    update: {
      value: otpEmailTemplate,
      type: SYSTEM_SETTING_TYPES.STRING,
    },
    create: {
      key: 'email_otp_template',
      value: otpEmailTemplate,
      type: SYSTEM_SETTING_TYPES.STRING,
      group: SYSTEM_SETTING_GROUPS.EMAIL,
      description: 'Mẫu email OTP (React Email Components)',
    },
  })

  // Email Viewing Reminder (cập nhật theo template trong thư mục emails)
  await prisma.systemSetting.upsert({
    where: { key: 'email_viewing_reminder_template' },
    update: {
      value: viewingReminderTemplate,
      type: SYSTEM_SETTING_TYPES.STRING,
    },
    create: {
      key: 'email_viewing_reminder_template',
      value: viewingReminderTemplate,
      type: SYSTEM_SETTING_TYPES.STRING,
      group: SYSTEM_SETTING_GROUPS.EMAIL,
      description: 'Mẫu email nhắc lịch xem phòng (React Email Components)',
    },
  })

  // Mẫu reset password cũ
  await prisma.systemSetting.upsert({
    where: { key: 'email_reset_password_template' },
    update: {},
    create: {
      key: 'email_reset_password_template',
      value: `<h1>Đặt lại mật khẩu</h1>
<p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã xác nhận sau: {{code}}</p>
<p>Mã xác nhận có hiệu lực trong vòng 10 phút.</p>
<p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
<p>Trân trọng,</p>
<p>Đội ngũ Rently</p>`,
      type: SYSTEM_SETTING_TYPES.STRING,
      group: SYSTEM_SETTING_GROUPS.EMAIL,
      description: 'Mẫu email đặt lại mật khẩu',
    },
  })

  // Email Rental Request (cập nhật theo template trong thư mục emails)
  await prisma.systemSetting.upsert({
    where: { key: 'email_new_rental_request_template' },
    update: {
      value: rentalRequestTemplate,
      type: SYSTEM_SETTING_TYPES.STRING,
    },
    create: {
      key: 'email_new_rental_request_template',
      value: rentalRequestTemplate,
      type: SYSTEM_SETTING_TYPES.STRING,
      group: SYSTEM_SETTING_GROUPS.EMAIL,
      description:
        'Mẫu email thông báo yêu cầu thuê mới (React Email Components)',
    },
  })

  // Email Rental Status Update (cập nhật theo template trong thư mục emails)
  await prisma.systemSetting.upsert({
    where: { key: 'email_rental_request_status_update_template' },
    update: {
      value: rentalStatusUpdateTemplate,
      type: SYSTEM_SETTING_TYPES.STRING,
    },
    create: {
      key: 'email_rental_request_status_update_template',
      value: rentalStatusUpdateTemplate,
      type: SYSTEM_SETTING_TYPES.STRING,
      group: SYSTEM_SETTING_GROUPS.EMAIL,
      description:
        'Mẫu email thông báo cập nhật trạng thái yêu cầu thuê (React Email Components)',
    },
  })

  // Cài đặt giá tiền
  await prisma.systemSetting.upsert({
    where: { key: 'post_price_normal' },
    update: {},
    create: {
      key: 'post_price_normal',
      value: '50000',
      type: SYSTEM_SETTING_TYPES.NUMBER,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Giá đăng bài thường (VND)',
    },
  })

  await prisma.systemSetting.upsert({
    where: { key: 'post_price_vip' },
    update: {},
    create: {
      key: 'post_price_vip',
      value: '100000',
      type: SYSTEM_SETTING_TYPES.NUMBER,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Giá đăng bài VIP (VND)',
    },
  })

  await prisma.systemSetting.upsert({
    where: { key: 'post_price_special' },
    update: {},
    create: {
      key: 'post_price_special',
      value: '200000',
      type: SYSTEM_SETTING_TYPES.NUMBER,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Giá đăng bài đặc biệt (VND)',
    },
  })

  await prisma.systemSetting.upsert({
    where: { key: 'post_duration_days' },
    update: {},
    create: {
      key: 'post_duration_days',
      value: '30',
      type: SYSTEM_SETTING_TYPES.NUMBER,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Thời gian hiển thị bài đăng (ngày)',
    },
  })

  // Cài đặt subscription cho landlord
  await prisma.systemSetting.upsert({
    where: { key: 'landlord_subscription_monthly_fee' },
    update: {},
    create: {
      key: 'landlord_subscription_monthly_fee',
      value: '299000',
      type: SYSTEM_SETTING_TYPES.NUMBER,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Phí subscription hàng tháng cho landlord (VND)',
    },
  })

  await prisma.systemSetting.upsert({
    where: { key: 'landlord_subscription_free_trial_days' },
    update: {},
    create: {
      key: 'landlord_subscription_free_trial_days',
      value: '30',
      type: SYSTEM_SETTING_TYPES.NUMBER,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Số ngày dùng thử miễn phí cho landlord',
    },
  })

  await prisma.systemSetting.upsert({
    where: { key: 'landlord_subscription_grace_period_days' },
    update: {},
    create: {
      key: 'landlord_subscription_grace_period_days',
      value: '7',
      type: SYSTEM_SETTING_TYPES.NUMBER,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Số ngày gia hạn sau khi hết hạn subscription',
    },
  })

  await prisma.systemSetting.upsert({
    where: { key: 'landlord_subscription_enabled' },
    update: {},
    create: {
      key: 'landlord_subscription_enabled',
      value: 'true',
      type: SYSTEM_SETTING_TYPES.BOOLEAN,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Bật/tắt chế độ subscription cho landlord',
    },
  })

  await prisma.systemSetting.upsert({
    where: { key: 'post_payment_enabled' },
    update: {},
    create: {
      key: 'post_payment_enabled',
      value: 'false',
      type: SYSTEM_SETTING_TYPES.BOOLEAN,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Bật/tắt chế độ thanh toán per-post (legacy)',
    },
  })

  // Cấu hình các gói subscription (JSON)
  await prisma.systemSetting.upsert({
    where: { key: 'subscription_plans' },
    update: {},
    create: {
      key: 'subscription_plans',
      value: JSON.stringify([
        {
          id: 'free_trial',
          name: 'Dùng thử miễn phí',
          description: 'Trải nghiệm đầy đủ tính năng trong 30 ngày',
          price: 0,
          duration: 30,
          durationType: 'days',
          features: [
            'Đăng bài cho thuê không giới hạn',
            'Quản lý phòng trọ và hợp đồng',
            'Nhận yêu cầu thuê và lịch xem phòng',
            'Hỗ trợ khách hàng',
            'Tự động chuyển sang gói trả phí sau 30 ngày',
          ],
          isFreeTrial: true,
          isActive: true,
          color: 'green',
          badge: 'Khuyến nghị',
          icon: 'gift',
        },
        {
          id: 'basic_monthly',
          name: 'Gói cơ bản',
          description: 'Gói cơ bản hàng tháng cho landlord',
          price: 299000,
          duration: 1,
          durationType: 'months',
          features: [
            'Đăng bài cho thuê không giới hạn',
            'Quản lý phòng trọ và hợp đồng',
            'Nhận yêu cầu thuê và lịch xem phòng',
            'Hỗ trợ khách hàng ưu tiên',
            'Báo cáo thống kê chi tiết',
          ],
          isFreeTrial: false,
          isActive: true,
          color: 'blue',
          badge: null,
          icon: 'crown',
        },
        {
          id: 'premium_monthly',
          name: 'Gói cao cấp',
          description: 'Gói cao cấp với nhiều tính năng nâng cao',
          price: 599000,
          duration: 1,
          durationType: 'months',
          features: [
            'Tất cả tính năng gói cơ bản',
            'Ưu tiên hiển thị bài đăng',
            'Analytics chi tiết',
            'Hỗ trợ 24/7',
            'Template hợp đồng premium',
            'Quản lý nhiều tài khoản',
          ],
          isFreeTrial: false,
          isActive: true,
          color: 'purple',
          badge: 'Phổ biến',
          icon: 'star',
        },
        {
          id: 'yearly_basic',
          name: 'Gói cơ bản (Năm)',
          description: 'Gói cơ bản thanh toán theo năm - Tiết kiệm 20%',
          price: 2870400, // 299000 * 12 * 0.8 = tiết kiệm 20%
          duration: 12,
          durationType: 'months',
          features: [
            'Tất cả tính năng gói cơ bản',
            'Tiết kiệm 20% so với thanh toán hàng tháng',
            'Ưu tiên hỗ trợ',
          ],
          isFreeTrial: false,
          isActive: true,
          color: 'amber',
          badge: 'Tiết kiệm',
          icon: 'calendar',
        },
      ]),
      type: SYSTEM_SETTING_TYPES.JSON,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Cấu hình các gói subscription cho landlord',
    },
  })

  console.log('System settings seeded successfully')
}
