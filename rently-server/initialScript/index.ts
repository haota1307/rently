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
    console.log('Creating roles...')
    // Tạo roles
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

  console.log(
    `Pricing settings: ${pricingSettingsCreated} created, ${pricingSettingsUpdated} updated`
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
      console.log('Script completed successfully')
    }
  )
  .catch(console.error)
