import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { HTTPMethod, RoleName } from 'src/shared/constants/role.constant'
import { PrismaService } from 'src/shared/services/prisma.service'

const prisma = new PrismaService()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3010)
  const server = app.getHttpAdapter().getInstance()
  const router = server.router
  const permissionsInDb = await prisma.permission.findMany({
    where: {
      deletedAt: null,
    },
  })
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
        const moduleName = String(path.split('/')[1]).toUpperCase()
        return {
          path,
          method,
          name: method + ' ' + path,
          module: moduleName,
        }
      }
    })
    .filter(item => item !== undefined)
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

  // Tìm permissions trong database mà không tồn tại trong availableRoutes
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
    console.log('Deleted permissions:', deleteResult.count)
  } else {
    console.log('No permissions to delete')
  }
  // Tìm routes mà không tồn tại trong permissionsInDb
  const routesToAdd = availableRoutes.filter(item => {
    return !permissionInDbMap[`${item.method}-${item.path}`]
  })
  // Thêm các routes này dưới dạng permissions database
  if (routesToAdd.length > 0) {
    const permissionsToAdd = await prisma.permission.createMany({
      data: routesToAdd,
      skipDuplicates: true,
    })
    console.log('Added permissions:', permissionsToAdd.count)
  } else {
    console.log('No permissions to add')
  }

  // Lấy lại permissions trong database sau khi thêm mới (hoặc bị xóa)
  const updatedPermissionsInDb = await prisma.permission.findMany({
    where: {
      deletedAt: null,
    },
  })

  // Cập nhật lại các permissions trong Admin Role
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

  // Cập nhật permissions cho Client Role
  const clientRole = await prisma.role.findFirstOrThrow({
    where: {
      name: RoleName.Client,
      deletedAt: null,
    },
  })

  // Client có tất cả quyền trừ quản lý trang web và quản lý cho thuê
  const clientPermissions = updatedPermissionsInDb.filter(permission => {
    // Loại bỏ tất cả quyền quản trị trang web
    const isAdminRoute =
      permission.path.includes('/admin') ||
      permission.module === 'STATISTICS' ||
      permission.path.includes('/dashboard') ||
      permission.path.includes('/role')

    // Loại bỏ quyền quản lý cho thuê (rental management)
    const isRentalManagement =
      (permission.path.includes('/rental') && permission.method !== 'GET') ||
      (permission.path.includes('/room') && permission.method !== 'GET') ||
      (permission.path.includes('/post') &&
        (permission.method === 'PUT' ||
          permission.method === 'DELETE' ||
          permission.method === 'PATCH'))

    return !isAdminRoute && !isRentalManagement
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

  // Cập nhật permissions cho Landlord Role
  const landlordRole = await prisma.role.findFirstOrThrow({
    where: {
      name: RoleName.Landlord,
      deletedAt: null,
    },
  })

  // Landlord có toàn quyền giống admin ngoại trừ quyền quản lý trang web
  const landlordPermissions = updatedPermissionsInDb.filter(permission => {
    // Loại bỏ tất cả quyền quản trị trang web
    const isAdminRoute =
      permission.path.includes('/admin') ||
      permission.module === 'STATISTICS' ||
      permission.path.includes('/dashboard') ||
      permission.path.includes('/role')

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

  console.log('Updated permissions for Admin, Client, and Landlord roles')
  process.exit(0)
}
bootstrap()
