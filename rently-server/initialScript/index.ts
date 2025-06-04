import envConfig from 'src/shared/config'
import { RoleName } from 'src/shared/constants/role.constant'
import { HashingService } from 'src/shared/services/hashing.service'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  SYSTEM_SETTING_GROUPS,
  SYSTEM_SETTING_TYPES,
} from 'src/routes/system-setting/system-setting.model'
import * as fs from 'fs'
import * as path from 'path'
import { User } from '@prisma/client'

const prisma = new PrismaService()
const hashingService = new HashingService()

const main = async () => {
  let createdRoleCount = 0
  let adminUser: User | null = null

  // Kiểm tra và tạo roles nếu chưa tồn tại
  const roleCount = await prisma.role.count()
  if (roleCount === 0) {
    const roles = await prisma.role.createMany({
      data: [
        {
          name: RoleName.Admin,
          description: 'Admin role',
        },
        {
          name: RoleName.Landlord,
          description: 'Landlord role',
        },
        {
          name: RoleName.Client,
          description: 'Client role',
        },
      ],
    })
    createdRoleCount = roles.count

    // Lấy role Admin
    const adminRole = await prisma.role.findFirstOrThrow({
      where: {
        name: RoleName.Admin,
      },
    })

    // Tạo tài khoản Admin
    const hashedPassword = await hashingService.hash(envConfig.ADMIN_PASSWORD)
    adminUser = await prisma.user.create({
      data: {
        email: envConfig.ADMIN_EMAIL,
        password: hashedPassword,
        status: 'ACTIVE',
        name: envConfig.ADMIN_NAME,
        phoneNumber: envConfig.ADMIN_PHONE_NUMBER,
        roleId: adminRole.id,
      },
    })
    console.log(`Created ${createdRoleCount} roles`)
    if (adminUser) {
      console.log(`Created admin user: ${adminUser.email}`)
    }
  } else {
    console.log('Roles already exist, skipping role creation')
  }

  // Tạo dữ liệu mẫu cho tiện ích phòng trọ
  const amenitiesCount = await prisma.amenity.count()
  let createdAmenitiesCount = 0

  if (amenitiesCount === 0) {
    console.log('Creating amenities...')
    const amenitiesData = [
      { name: 'Wi-Fi' },
      { name: 'Điều hòa' },
      { name: 'Chỗ để xe' },
      { name: 'An ninh' },
      { name: 'Nội thất' },
      { name: 'WC riêng' },
      { name: 'Nhà bếp' },
      { name: 'Thú cưng' },
    ]

    // Dùng createMany để thêm nhiều tiện ích cùng lúc
    const amenities = await prisma.amenity.createMany({
      data: amenitiesData,
      skipDuplicates: true,
    })
    createdAmenitiesCount = amenities.count
    console.log(`Created ${createdAmenitiesCount} amenities`)
  } else {
    console.log('Amenities already exist, skipping amenities creation')
  }

  // Tạo dữ liệu cài đặt giá đăng bài và thời gian
  console.log('Checking and creating pricing settings...')
  let pricingSettingsCreated = 0
  let pricingSettingsUpdated = 0

  // Danh sách các cài đặt giá cần tạo - chỉ dùng một tùy chọn duy nhất
  const pricingSettings = [
    {
      key: 'post_price',
      value: '10000',
      type: SYSTEM_SETTING_TYPES.NUMBER,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Giá đăng bài (VND)',
    },
    {
      key: 'post_duration_days',
      value: '30',
      type: SYSTEM_SETTING_TYPES.NUMBER,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Thời gian hiển thị bài đăng (ngày)',
    },
  ]

  // Tạo hoặc cập nhật từng cài đặt giá
  for (const setting of pricingSettings) {
    const existingSetting = await prisma.systemSetting.findUnique({
      where: { key: setting.key },
    })

    if (existingSetting) {
      await prisma.systemSetting.update({
        where: { key: setting.key },
        data: setting,
      })
      pricingSettingsUpdated++
      console.log(`Updated pricing setting: ${setting.key}`)
    } else {
      await prisma.systemSetting.create({
        data: setting,
      })
      pricingSettingsCreated++
      console.log(`Created pricing setting: ${setting.key}`)
    }
  }

  // Thêm cài đặt subscription cho landlord
  console.log('Checking and creating subscription settings...')
  let subscriptionSettingsCreated = 0
  let subscriptionSettingsUpdated = 0

  // Danh sách các cài đặt subscription cơ bản
  const subscriptionSettings = [
    {
      key: 'landlord_subscription_monthly_fee',
      value: '299000',
      type: SYSTEM_SETTING_TYPES.NUMBER,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Phí subscription hàng tháng cho landlord (VND)',
    },
    {
      key: 'landlord_subscription_free_trial_days',
      value: '30',
      type: SYSTEM_SETTING_TYPES.NUMBER,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Số ngày dùng thử miễn phí cho landlord',
    },
    {
      key: 'landlord_subscription_grace_period_days',
      value: '7',
      type: SYSTEM_SETTING_TYPES.NUMBER,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Số ngày gia hạn sau khi hết hạn subscription',
    },
    {
      key: 'landlord_subscription_enabled',
      value: 'true',
      type: SYSTEM_SETTING_TYPES.BOOLEAN,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Bật/tắt chế độ subscription cho landlord',
    },
    {
      key: 'post_payment_enabled',
      value: 'false',
      type: SYSTEM_SETTING_TYPES.BOOLEAN,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Bật/tắt chế độ thanh toán per-post (legacy)',
    },
  ]

  // Danh sách các gói subscription plan
  const subscriptionPlans = [
    {
      key: 'subscription_plan_free_trial',
      value: JSON.stringify({
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
      }),
      type: SYSTEM_SETTING_TYPES.JSON,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Gói dùng thử miễn phí',
    },
    {
      key: 'subscription_plan_basic_monthly',
      value: JSON.stringify({
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
      }),
      type: SYSTEM_SETTING_TYPES.JSON,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Gói cơ bản hàng tháng',
    },
    {
      key: 'subscription_plan_premium_monthly',
      value: JSON.stringify({
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
      }),
      type: SYSTEM_SETTING_TYPES.JSON,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Gói cao cấp hàng tháng',
    },
    {
      key: 'subscription_plan_yearly_basic',
      value: JSON.stringify({
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
      }),
      type: SYSTEM_SETTING_TYPES.JSON,
      group: SYSTEM_SETTING_GROUPS.PRICING,
      description: 'Gói cơ bản theo năm',
    },
  ]

  // Thêm các gói subscription vào danh sách cài đặt
  const allSubscriptionSettings = [
    ...subscriptionSettings,
    ...subscriptionPlans,
  ]

  // Tạo hoặc cập nhật từng cài đặt subscription
  for (const setting of allSubscriptionSettings) {
    const existingSetting = await prisma.systemSetting.findUnique({
      where: { key: setting.key },
    })

    if (existingSetting) {
      await prisma.systemSetting.update({
        where: { key: setting.key },
        data: setting,
      })
      subscriptionSettingsUpdated++
      console.log(`Updated subscription setting: ${setting.key}`)
    } else {
      await prisma.systemSetting.create({
        data: setting,
      })
      subscriptionSettingsCreated++
      console.log(`Created subscription setting: ${setting.key}`)
    }
  }

  console.log(
    `Pricing settings: ${pricingSettingsCreated} created, ${pricingSettingsUpdated} updated`
  )
  console.log(
    `Subscription settings: ${subscriptionSettingsCreated} created, ${subscriptionSettingsUpdated} updated`
  )

  // Tạo dữ liệu cài đặt giao diện mặc định
  console.log('Checking and creating interface settings...')
  let interfaceSettingsCreated = 0
  let interfaceSettingsUpdated = 0

  // Danh sách các cài đặt giao diện cần tạo
  const interfaceSettings = [
    {
      key: 'site_logo',
      value: '/logo.svg',
      type: SYSTEM_SETTING_TYPES.STRING,
      group: SYSTEM_SETTING_GROUPS.INTERFACE,
      description: 'Logo trang web',
    },
    {
      key: 'site_favicon',
      value: '/favicon.ico',
      type: SYSTEM_SETTING_TYPES.STRING,
      group: SYSTEM_SETTING_GROUPS.INTERFACE,
      description: 'Favicon trang web',
    },
    {
      key: 'hero_image',
      value: '/hero_img.jpg?height=600&width=1200',
      type: SYSTEM_SETTING_TYPES.STRING,
      group: SYSTEM_SETTING_GROUPS.INTERFACE,
      description: 'Hình ảnh hero section trang chủ',
    },
    {
      key: 'primary_color',
      value: '#1890ff',
      type: SYSTEM_SETTING_TYPES.STRING,
      group: SYSTEM_SETTING_GROUPS.INTERFACE,
      description: 'Màu chủ đạo của trang web',
    },
    {
      key: 'site_name',
      value: 'Rently',
      type: SYSTEM_SETTING_TYPES.STRING,
      group: SYSTEM_SETTING_GROUPS.INTERFACE,
      description: 'Tên trang web',
    },
    {
      key: 'site_description',
      value: 'Nền tảng kết nối chủ trọ và người thuê',
      type: SYSTEM_SETTING_TYPES.STRING,
      group: SYSTEM_SETTING_GROUPS.INTERFACE,
      description: 'Mô tả ngắn về trang web',
    },
    {
      key: 'footer_copyright',
      value: '© 2024 Rently. Đã đăng ký bản quyền.',
      type: SYSTEM_SETTING_TYPES.STRING,
      group: SYSTEM_SETTING_GROUPS.INTERFACE,
      description: 'Thông tin bản quyền ở footer',
    },
  ]

  // Tạo hoặc cập nhật từng cài đặt giao diện
  for (const setting of interfaceSettings) {
    const existingSetting = await prisma.systemSetting.findUnique({
      where: { key: setting.key },
    })

    if (existingSetting) {
      // Chỉ cập nhật nếu giá trị là rỗng
      if (!existingSetting.value || existingSetting.value === '') {
        await prisma.systemSetting.update({
          where: { key: setting.key },
          data: setting,
        })
        interfaceSettingsUpdated++
        console.log(`Updated interface setting: ${setting.key}`)
      } else {
        console.log(
          `Skipping interface setting: ${setting.key} (already has value)`
        )
      }
    } else {
      await prisma.systemSetting.create({
        data: setting,
      })
      interfaceSettingsCreated++
      console.log(`Created interface setting: ${setting.key}`)
    }
  }

  console.log(
    `Interface settings: ${interfaceSettingsCreated} created, ${interfaceSettingsUpdated} updated`
  )

  // Tạo mẫu email templates
  console.log('Creating email templates...')
  let emailTemplatesCount = 0
  let emailCreatedCount = 0
  let emailUpdatedCount = 0

  // Đọc nội dung từ thư mục emails
  try {
    const emailsDir = path.join(process.cwd(), 'emails')
    // Đọc tất cả các file email template trong thư mục
    const emailFiles = fs
      .readdirSync(emailsDir)
      .filter(file => file.endsWith('.tsx'))
    console.log(`Tìm thấy ${emailFiles.length} mẫu email trong thư mục emails`)

    // Lặp qua từng file email template và tạo/cập nhật trong database
    for (const emailFile of emailFiles) {
      try {
        const fileName = emailFile.replace('.tsx', '')
        const templateKey = `email_${fileName.replace(/-/g, '_')}_template`
        const emailContent = fs.readFileSync(
          path.join(emailsDir, emailFile),
          'utf-8'
        )

        // Kiểm tra xem template đã tồn tại chưa
        const existingTemplate = await prisma.systemSetting.findUnique({
          where: { key: templateKey },
        })

        if (existingTemplate) {
          // Cập nhật template nếu đã tồn tại
          await prisma.systemSetting.update({
            where: { key: templateKey },
            data: {
              value: emailContent,
              type: 'file',
              group: SYSTEM_SETTING_GROUPS.EMAIL,
              description: `Mẫu email ${fileName} (React Email Components)`,
            },
          })
          emailUpdatedCount++
          console.log(`Updated ${fileName} email template`)
        } else {
          // Tạo mới template nếu chưa tồn tại
          await prisma.systemSetting.create({
            data: {
              key: templateKey,
              value: emailContent,
              type: 'file',
              group: SYSTEM_SETTING_GROUPS.EMAIL,
              description: `Mẫu email ${fileName} (React Email Components)`,
            },
          })
          emailCreatedCount++
          console.log(`Created ${fileName} email template`)
        }

        emailTemplatesCount++
      } catch (error) {
        console.error(`Lỗi tạo/cập nhật template ${emailFile}:`, error)
      }
    }

    console.log(
      `Đã xử lý ${emailTemplatesCount} mẫu email: ${emailCreatedCount} tạo mới, ${emailUpdatedCount} cập nhật`
    )
  } catch (error) {
    console.error('Lỗi khi đọc thư mục email templates:', error)
  }

  return {
    createdRoleCount,
    adminUser,
    createdAmenitiesCount,
    emailTemplatesCount,
    pricingSettingsCreated,
    pricingSettingsUpdated,
    interfaceSettingsCreated,
    interfaceSettingsUpdated,
    subscriptionSettingsCreated,
    subscriptionSettingsUpdated,
  }
}

main()
  .then(
    ({
      createdRoleCount,
      adminUser,
      createdAmenitiesCount,
      emailTemplatesCount,
      pricingSettingsCreated,
      pricingSettingsUpdated,
      interfaceSettingsCreated,
      interfaceSettingsUpdated,
      subscriptionSettingsCreated,
      subscriptionSettingsUpdated,
    }) => {
      if (createdRoleCount > 0) {
        console.log(`Created ${createdRoleCount} roles`)
      }
      if (adminUser) {
        console.log(`Created admin user: ${adminUser.email}`)
      }
      if (createdAmenitiesCount > 0) {
        console.log(`Created ${createdAmenitiesCount} amenities`)
      }
      console.log(`Created/Updated ${emailTemplatesCount} email templates`)
      console.log(
        `Pricing settings: ${pricingSettingsCreated} created, ${pricingSettingsUpdated} updated`
      )
      console.log(
        `Interface settings: ${interfaceSettingsCreated} created, ${interfaceSettingsUpdated} updated`
      )
      console.log(
        `Subscription settings: ${subscriptionSettingsCreated} created, ${subscriptionSettingsUpdated} updated`
      )
      console.log('Script completed successfully')
    }
  )
  .catch(console.error)
