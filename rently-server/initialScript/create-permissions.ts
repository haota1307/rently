import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { HTTPMethod, RoleName } from 'src/shared/constants/role.constant'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Logger } from '@nestjs/common'

const prisma = new PrismaService()
const logger = new Logger('PermissionsSeeder')

// Danh sách các module hệ thống
const MODULES = {
  ADMIN: 'ADMIN',
  DASHBOARD: 'DASHBOARD',
  STATISTICS: 'STATISTICS',
  ROLE: 'ROLE',
  USER: 'USER',
  AUTH: 'AUTH',
  POST: 'POST',
  RENTAL: 'RENTAL',
  ROOM: 'ROOM',
  PAYMENT: 'PAYMENT',
  CHATBOT: 'CHATBOT',
  CONVERSATION: 'CONVERSATION',
  REPORT: 'REPORT',
  PROFILE: 'PROFILE',
  SETTING: 'SETTING',
  NOTIFICATION: 'NOTIFICATION',
}

// Hàm kiểm tra module dựa vào path
function getModuleFromPath(path: string): string {
  const segment = path.split('/')[1] || ''
  return segment.toUpperCase()
}

async function bootstrap() {
  logger.log('Bắt đầu tạo và cập nhật quyền...')

  const app = await NestFactory.create(AppModule)
  await app.listen(3010)
  const server = app.getHttpAdapter().getInstance()
  const router = server.router

  // Lấy tất cả permissions hiện có trong database
  logger.log('Đang lấy permissions từ database...')
  const permissionsInDb = await prisma.permission.findMany({
    where: {
      deletedAt: null,
    },
  })

  // Lấy tất cả routes của ứng dụng
  logger.log('Đang phân tích routes của ứng dụng...')
  const availableRoutes: {
    path: string
    method: keyof typeof HTTPMethod
    name: string
    module: string
  }[] = router.stack
    .map(layer => {
      if (layer.route) {
        const path = layer.route?.path
        const method = String(
          layer.route?.stack[0].method
        ).toUpperCase() as keyof typeof HTTPMethod
        const module = getModuleFromPath(path)
        return {
          path,
          method,
          name: method + ' ' + path,
          module,
        }
      }
    })
    .filter(item => item !== undefined)

  logger.log(
    `Đã tìm thấy tổng cộng ${availableRoutes.length} routes trong ứng dụng`
  )

  // Tạo object permissionInDbMap với key là [method-path]
  const permissionInDbMap: Record<string, (typeof permissionsInDb)[0]> =
    permissionsInDb.reduce((acc, item) => {
      acc[`${item.method}-${item.path}`] = item
      return acc
    }, {})

  // Tạo object availableRoutesMap với key là [method-path]
  const availableRoutesMap: Record<string, (typeof availableRoutes)[0]> =
    availableRoutes.reduce((acc, item) => {
      acc[`${item.method}-${item.path}`] = item
      return acc
    }, {})

  // Tìm permissions trong database mà không tồn tại trong availableRoutes (đã bị xóa trong code)
  const permissionsToDelete = permissionsInDb.filter(item => {
    return !availableRoutesMap[`${item.method}-${item.path}`]
  })

  // Xóa permissions không tồn tại trong availableRoutes
  if (permissionsToDelete.length > 0) {
    const deleteResult = await prisma.permission.deleteMany({
      where: {
        id: {
          in: permissionsToDelete.map(item => item.id),
        },
      },
    })
    logger.log(
      `Đã xóa ${deleteResult.count} permissions không còn tồn tại trong ứng dụng`
    )
  } else {
    logger.log('Không có permissions cần xóa')
  }

  // Tìm routes mà không tồn tại trong permissionsInDb (routes mới được thêm vào)
  const routesToAdd = availableRoutes.filter(item => {
    return !permissionInDbMap[`${item.method}-${item.path}`]
  })

  // Thêm các routes này dưới dạng permissions vào database
  if (routesToAdd.length > 0) {
    const permissionsToAdd = await prisma.permission.createMany({
      data: routesToAdd,
      skipDuplicates: true,
    })
    logger.log(
      `Đã thêm ${permissionsToAdd.count} permissions mới từ routes của ứng dụng`
    )
  } else {
    logger.log('Không có permissions mới cần thêm')
  }

  // Lấy lại toàn bộ danh sách permissions sau khi đã cập nhật
  const updatedPermissionsInDb = await prisma.permission.findMany({
    where: {
      deletedAt: null,
    },
  })
  logger.log(`Tổng số permissions hiện tại: ${updatedPermissionsInDb.length}`)

  // ===== PHÂN QUYỀN CHO CÁC VAI TRÒ =====
  logger.log('Bắt đầu phân quyền cho các vai trò...')

  // === 1. VAI TRÒ ADMIN ===
  // Admin có toàn bộ quyền trong hệ thống
  const adminRole = await prisma.role.findFirstOrThrow({
    where: {
      name: RoleName.Admin,
      deletedAt: null,
    },
  })

  await prisma.role.update({
    where: {
      id: adminRole.id,
    },
    data: {
      permissions: {
        set: updatedPermissionsInDb.map(item => ({ id: item.id })),
      },
    },
  })
  logger.log(
    `Đã cập nhật ${updatedPermissionsInDb.length} quyền cho vai trò ADMIN`
  )

  // === 2. VÀI TRÒ CLIENT (NGƯỜI THUÊ) ===
  const clientRole = await prisma.role.findFirstOrThrow({
    where: {
      name: RoleName.Client,
      deletedAt: null,
    },
  })

  // Quy tắc: CLIENT chỉ có quyền liên quan đến người dùng thông thường
  const clientPermissions = updatedPermissionsInDb.filter(permission => {
    // Lọc các quyền dành cho người dùng thông thường

    // Các quyền liên quan đến xác thực và đăng ký/đăng nhập
    if (permission.path.includes('/auth')) {
      return true
    }

    // Quyền xem thông tin bài đăng, phòng, nhà trọ (chỉ đọc)
    if (
      (permission.path.includes('/posts') ||
        permission.path.includes('/rentals') ||
        permission.path.includes('/rooms')) &&
      permission.method === 'GET'
    ) {
      return true
    }

    // Quyền yêu cầu xem phòng và thuê phòng
    if (
      permission.path.includes('/viewing-schedule') ||
      permission.path.includes('/rental-request')
    ) {
      return true
    }

    // Quyền tương tác với chatbot và tin nhắn
    if (
      permission.path.includes('/chatbot') ||
      permission.path.includes('/conversation') ||
      permission.path.includes('/messages')
    ) {
      return true
    }

    // Quyền quản lý hồ sơ và thông tin cá nhân
    if (
      permission.path.includes('/profile') ||
      permission.path.includes('/me')
    ) {
      return true
    }

    // Quyền báo cáo bài đăng
    if (permission.path.includes('/post-report')) {
      return true
    }

    // Quyền bình luận và đánh dấu yêu thích
    if (
      permission.path.includes('/comment') ||
      permission.path.includes('/favorite')
    ) {
      return true
    }

    // Quyền thanh toán (nhưng không phải quản lý thanh toán)
    if (
      permission.path.includes('/payment') &&
      !permission.path.includes('/admin') &&
      !permission.path.includes('/dashboard') &&
      !permission.path.includes('/statistics')
    ) {
      return true
    }

    // Quyền xem thông báo
    if (permission.path.includes('/notification')) {
      return true
    }

    // Quyền yêu cầu nâng cấp lên vai trò landlord
    if (permission.path.includes('/role-upgrade-request')) {
      return true
    }

    // Quyền tải lên file
    if (permission.path.includes('/upload')) {
      return true
    }

    // Quyền liên hệ
    if (permission.path.includes('/contact')) {
      return true
    }

    // Quyền xem hợp đồng thuê trọ (chỉ xem, không tạo)
    if (
      permission.path.includes('/rental-contract') &&
      permission.method === 'GET'
    ) {
      return true
    }

    // Loại bỏ các quyền quản trị
    if (
      permission.path.includes('/admin') ||
      permission.path.includes('/dashboard') ||
      permission.module === MODULES.STATISTICS ||
      permission.module === MODULES.ROLE ||
      permission.path.includes('/system-setting')
    ) {
      return false
    }

    // Loại bỏ các quyền tạo, sửa, xóa phòng trọ, nhà trọ, đăng bài
    if (
      (permission.path.includes('/rentals') && permission.method !== 'GET') ||
      (permission.path.includes('/rooms') && permission.method !== 'GET') ||
      (permission.path.includes('/posts') && permission.method !== 'GET')
    ) {
      return false
    }

    return false
  })

  await prisma.role.update({
    where: {
      id: clientRole.id,
    },
    data: {
      permissions: {
        set: clientPermissions.map(item => ({ id: item.id })),
      },
    },
  })
  logger.log(`Đã cập nhật ${clientPermissions.length} quyền cho vai trò CLIENT`)

  // === 3. VAI TRÒ LANDLORD (CHỦ TRỌ) ===
  const landlordRole = await prisma.role.findFirstOrThrow({
    where: {
      name: RoleName.Landlord,
      deletedAt: null,
    },
  })

  // Quy tắc: Landlord có tất cả quyền của CLIENT và thêm quyền quản lý phòng trọ, đăng bài, duyệt yêu cầu thuê...
  const landlordPermissions = updatedPermissionsInDb.filter(permission => {
    // Loại bỏ các quyền quản trị hệ thống dành cho ADMIN
    const isAdminRoute =
      (permission.path.includes('/admin') &&
        permission.path !== '/admin/rental-contracts') ||
      permission.path.includes('/dashboard/admin') ||
      (permission.module === MODULES.ROLE &&
        !permission.path.includes('/role-upgrade-request')) ||
      permission.path.includes('/system-setting')

    // Các quyền thống kê cho landlord (chỉ xem thống kê của mình)
    const isAllowedStatistics =
      permission.path.includes('/statistics') &&
      !permission.path.includes('/admin')

    // Các quyền đặc biệt cho landlord
    const isLandlordRoute =
      // Quản lý phòng trọ, nhà trọ
      permission.path.includes('/rentals') ||
      permission.path.includes('/rooms') ||
      // Đăng bài và quản lý bài đăng
      permission.path.includes('/posts') ||
      // Quản lý yêu cầu thuê và xem phòng
      permission.path.includes('/rental-request') ||
      permission.path.includes('/viewing-schedule') ||
      // Quản lý hợp đồng
      permission.path.includes('/rental-contract') ||
      // Xem thống kê cá nhân
      isAllowedStatistics

    // Các quyền công khai hoặc quyền cơ bản của người dùng
    const isCommonRoute =
      // Xác thực và quản lý tài khoản
      permission.path.includes('/auth') ||
      permission.path.includes('/profile') ||
      permission.path.includes('/me') ||
      // Chat và tin nhắn
      permission.path.includes('/chatbot') ||
      permission.path.includes('/conversation') ||
      permission.path.includes('/messages') ||
      // Thanh toán
      permission.path.includes('/payment') ||
      // Thông báo
      permission.path.includes('/notification') ||
      // Upload file
      permission.path.includes('/upload') ||
      // Bình luận và yêu thích
      permission.path.includes('/comment') ||
      permission.path.includes('/favorite') ||
      // Liên hệ
      permission.path.includes('/contact')

    // Cho phép landlord truy cập tất cả routes NGOẠI TRỪ routes dành riêng cho admin
    return (isLandlordRoute || isCommonRoute) && !isAdminRoute
  })

  await prisma.role.update({
    where: {
      id: landlordRole.id,
    },
    data: {
      permissions: {
        set: landlordPermissions.map(item => ({ id: item.id })),
      },
    },
  })
  logger.log(
    `Đã cập nhật ${landlordPermissions.length} quyền cho vai trò LANDLORD`
  )

  logger.log('Phân quyền hoàn tất!')
  await app.close()
  process.exit(0)
}

bootstrap().catch(error => {
  logger.error('Lỗi khi tạo và cập nhật quyền: ' + error.message)
  process.exit(1)
})
