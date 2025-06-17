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
import { seedSubscriptionPlans } from './seed-subscription-plans'

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
    console.log(`Created ${createdRoleCount} roles`)
  } else {
    console.log('Roles already exist, skipping role creation')
  }

  // Lấy role Admin - luôn thực hiện bước này
  const adminRole = await prisma.role.findFirstOrThrow({
    where: {
      name: RoleName.Admin,
    },
  })

  // Kiểm tra xem có tài khoản admin chưa
  const adminExists = await prisma.user.findFirst({
    where: {
      email: envConfig.ADMIN_EMAIL,
    },
  })

  // Tạo tài khoản Admin nếu chưa tồn tại
  if (!adminExists) {
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
    if (adminUser) {
      console.log(`Created admin user: ${adminUser.email}`)
    }
  } else {
    console.log(`Admin user already exists: ${adminExists.email}`)
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

  // Thêm các gói subscription mới vào bảng SubscriptionPlan
  const {
    createdCount: subscriptionPlansCreated,
    updatedCount: subscriptionPlansUpdated,
  } = await seedSubscriptionPlans(prisma)

  console.log(
    `Pricing settings: ${pricingSettingsCreated} created, ${pricingSettingsUpdated} updated`
  )
  console.log(
    `Subscription plans: ${subscriptionPlansCreated} created, ${subscriptionPlansUpdated} updated`
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
              type: 'string',
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
              type: 'string',
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
    subscriptionPlansCreated,
    subscriptionPlansUpdated,
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
      subscriptionPlansCreated,
      subscriptionPlansUpdated,
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
        `Subscription plans: ${subscriptionPlansCreated} created, ${subscriptionPlansUpdated} updated`
      )
      console.log('Script completed successfully')
    }
  )
  .catch(console.error)
