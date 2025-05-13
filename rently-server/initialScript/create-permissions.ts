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

  // === 2. VAI TRÒ CLIENT (NGƯỜI THUÊ) ===
  const clientRole = await prisma.role.findFirstOrThrow({
    where: {
      name: RoleName.Client,
      deletedAt: null,
    },
  })

  // Quy tắc: Client chỉ có quyền liên quan đến người dùng thông thường
  const clientPermissions = updatedPermissionsInDb.filter(permission => {
    // Chức năng người dùng thông thường được phép sử dụng
    const isAllowedPath =
      // Quyền xem thông tin bài đăng
      (permission.path.includes('/post') && permission.method === 'GET') ||
      // Quyền xem thông tin phòng, nhà trọ
      (permission.path.includes('/rental') && permission.method === 'GET') ||
      (permission.path.includes('/room') && permission.method === 'GET') ||
      // Quyền xem và sử dụng chatbot, chat với chủ trọ
      permission.path.includes('/chatbot') ||
      permission.path.includes('/conversation') ||
      // Quyền quản lý profile cá nhân
      permission.path.includes('/profile') ||
      permission.path.includes('/me') ||
      // Quyền quản lý yêu cầu xem phòng, thuê phòng
      permission.path.includes('/viewing-schedule') ||
      permission.path.includes('/rental-request') ||
      // Quyền liên quan đến thanh toán
      (permission.path.includes('/payment') &&
        !permission.path.includes('/admin') &&
        !permission.path.includes('/dashboard')) ||
      // Quyền báo cáo bài viết
      permission.path.includes('/report') ||
      // Quyền thêm, xóa, sửa favorite
      permission.path.includes('/favorite') ||
      // Quyền liên quan đến xác thực
      permission.path.includes('/auth') ||
      // Quyền xem thông báo
      permission.path.includes('/notification') ||
      // Quyền tìm kiếm
      permission.path.includes('/search') ||
      // Quyền yêu cầu nâng cấp vai trò (từ client lên landlord)
      permission.path.includes('/role-upgrade-request')

    // Loại bỏ các quyền quản trị hệ thống
    const isAdminRoute =
      permission.path.includes('/admin') ||
      permission.path.includes('/dashboard') ||
      permission.module === MODULES.STATISTICS ||
      permission.module === MODULES.ROLE ||
      permission.path.includes('/system-setting')

    // Loại bỏ các quyền thao tác của chủ trọ (quản lý phòng trọ, đăng bài)
    const isLandlordRoute =
      (permission.path.includes('/rental') && permission.method !== 'GET') ||
      (permission.path.includes('/room') && permission.method !== 'GET') ||
      (permission.path.includes('/post') && permission.method !== 'GET')

    return isAllowedPath && !isAdminRoute && !isLandlordRoute
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

  // Quy tắc: Landlord có quyền quản lý phòng trọ, đăng bài, chấp nhận yêu cầu thuê,
  // nhưng không có quyền quản trị hệ thống
  const landlordPermissions = updatedPermissionsInDb.filter(permission => {
    // Loại bỏ các quyền quản trị hệ thống
    const isAdminRoute =
      permission.path.includes('/admin') ||
      permission.path.includes('/dashboard') ||
      permission.module === MODULES.STATISTICS ||
      permission.module === MODULES.ROLE ||
      permission.path.includes('/system-setting')

    // Nếu không phải quyền quản trị, cho phép các quyền còn lại
    // Bao gồm các quyền của Client và thêm quyền quản lý phòng trọ
    return !isAdminRoute
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
