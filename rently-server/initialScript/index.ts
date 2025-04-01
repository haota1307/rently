import envConfig from 'src/shared/config'
import { RoleName } from 'src/shared/constants/role.constant'
import { HashingService } from 'src/shared/services/hashing.service'
import { PrismaService } from 'src/shared/services/prisma.service'

const prisma = new PrismaService()
const hashingService = new HashingService()

const main = async () => {
  // Kiểm tra và tạo roles nếu chưa tồn tại
  const roleCount = await prisma.role.count()
  if (roleCount > 0) {
    throw new Error('Roles already exist')
  }

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

  // Lấy role Admin
  const adminRole = await prisma.role.findFirstOrThrow({
    where: {
      name: RoleName.Admin,
    },
  })

  // Tạo tài khoản Admin
  const hashedPassword = await hashingService.hash(envConfig.ADMIN_PASSWORD)
  const adminUser = await prisma.user.create({
    data: {
      email: envConfig.ADMIN_EMAIL,
      password: hashedPassword,
      name: envConfig.ADMIN_NAME,
      phoneNumber: envConfig.ADMIN_PHONE_NUMBER,
      roleId: adminRole.id,
    },
  })

  // Tạo dữ liệu mẫu cho tiện ích phòng trọ
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

  return {
    createdRoleCount: roles.count,
    adminUser,
    createdAmenitiesCount: amenities.count,
  }
}

main()
  .then(({ adminUser, createdRoleCount, createdAmenitiesCount }) => {
    console.log(`Created ${createdRoleCount} roles`)
    console.log(`Created admin user: ${adminUser.email}`)
    console.log(`Created ${createdAmenitiesCount} amenities`)
  })
  .catch(console.error)
