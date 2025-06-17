import { PrismaClient } from '@prisma/client'
import { SYSTEM_SETTING_TYPES } from './system-setting.model'

/**
 * Script to remove color-related settings from the database
 * Run this script with: npx ts-node src/routes/system-setting/remove-color-settings.ts
 */
async function removeColorSettings() {
  console.log('Starting to remove color-related settings...')

  const prisma = new PrismaClient()

  try {
    // Tìm tất cả cài đặt liên quan đến màu sắc
    const colorSettings = await prisma.systemSetting.findMany({
      where: {
        OR: [
          { key: { contains: 'color' } },
          { key: { contains: 'theme' } },
          { key: { contains: 'background' } },
          { key: { equals: 'primary_color' } },
          { key: { equals: 'secondary_color' } },
          { key: { equals: 'accent_color' } },
        ],
      },
    })

    console.log(`Found ${colorSettings.length} color-related settings:`)
    colorSettings.forEach(setting => {
      console.log(`- ${setting.key}: ${setting.value}`)
    })

    // Xóa các cài đặt liên quan đến màu sắc
    if (colorSettings.length > 0) {
      const deletePromises = colorSettings.map(setting =>
        prisma.systemSetting.delete({
          where: { key: setting.key },
        })
      )

      await Promise.all(deletePromises)
      console.log(
        `Successfully removed ${colorSettings.length} color-related settings.`
      )
    } else {
      console.log('No color-related settings found.')
    }

    // Cập nhật lại các mẫu subscription plan để loại bỏ thuộc tính color
    const subscriptionPlansKey = 'subscription_plans'
    const subscriptionPlans = await prisma.systemSetting.findUnique({
      where: { key: subscriptionPlansKey },
    })

    if (subscriptionPlans && subscriptionPlans.type === 'json') {
      try {
        const plans = JSON.parse(subscriptionPlans.value)

        // Loại bỏ thuộc tính color từ mỗi plan
        const updatedPlans = plans.map(plan => {
          const { color, ...restPlan } = plan
          return restPlan
        })

        // Cập nhật cài đặt
        await prisma.systemSetting.update({
          where: { key: subscriptionPlansKey },
          data: { value: JSON.stringify(updatedPlans) },
        })

        console.log(
          'Successfully removed color properties from subscription plans.'
        )
      } catch (error) {
        console.error('Error updating subscription plans:', error)
      }
    }
  } catch (error) {
    console.error('Error removing color settings:', error)
  } finally {
    await prisma.$disconnect()
    console.log('Finished removing color-related settings.')
  }
}

/**
 * Script để cập nhật loại dữ liệu từ FILE sang STRING cho các mẫu email
 */
async function updateEmailTemplateTypes() {
  const prisma = new PrismaClient()

  try {
    console.log('Bắt đầu cập nhật loại dữ liệu cho các mẫu email...')

    // Danh sách các key của mẫu email cần cập nhật
    const emailTemplateKeys = [
      'email_otp_template',
      'email_viewing_reminder_template',
      'email_new_rental_request_template',
      'email_rental_request_status_update_template',
      'email_room_bill_template',
      'email_contact_notification',
      'email_contact_response',
    ]

    // Cập nhật từng mẫu email
    for (const key of emailTemplateKeys) {
      const setting = await prisma.systemSetting.findUnique({
        where: { key },
      })

      if (setting && setting.type === 'file') {
        await prisma.systemSetting.update({
          where: { key },
          data: {
            type: SYSTEM_SETTING_TYPES.STRING,
          },
        })
        console.log(`Đã cập nhật loại dữ liệu cho ${key} từ FILE sang STRING`)
      } else if (setting) {
        console.log(
          `${key} đã có loại dữ liệu là ${setting.type}, không cần cập nhật`
        )
      } else {
        console.log(`Không tìm thấy cài đặt với khóa ${key}`)
      }
    }

    console.log('Hoàn tất cập nhật loại dữ liệu cho các mẫu email')
  } catch (error) {
    console.error('Lỗi khi cập nhật loại dữ liệu:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Chạy script
removeColorSettings()
  .then(() => console.log('Script completed successfully.'))
  .catch(error => console.error('Script failed:', error))

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  updateEmailTemplateTypes()
    .then(() => {
      console.log('Script đã chạy xong')
      process.exit(0)
    })
    .catch(error => {
      console.error('Lỗi khi chạy script:', error)
      process.exit(1)
    })
}

export { updateEmailTemplateTypes }
