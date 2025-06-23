import { Injectable, InternalServerErrorException } from '@nestjs/common'

import { PrismaService } from 'src/shared/services/prisma.service'
import { Decimal } from '@prisma/client/runtime/library'
import {
  CreateRoomBodyType,
  CreateBulkRoomsBodyType,
  CreateBulkRoomsResType,
  GetRoomsQueryType,
  GetRoomsResType,
  RoomType,
  UpdateRoomBodyType,
} from 'src/shared/models/shared-room.model'

@Injectable()
export class RoomRepo {
  constructor(private prismaService: PrismaService) {}

  // Helper: chuyển đổi các trường cần thiết (chỉ cần chuyển price từ Decimal sang number)
  private formatRoom = (room: any): RoomType => {
    return {
      ...room,
      price: (room.price as Decimal).toNumber(),
    } as RoomType
  }

  async list(query: GetRoomsQueryType): Promise<GetRoomsResType> {
    try {
      const skip = (query.page - 1) * query.limit
      const take = query.limit
      const where: any = {}

      if (query.title) {
        where.title = { contains: query.title, mode: 'insensitive' }
      }

      // Lọc theo trạng thái
      if (query.status) {
        if (query.status === 'available') {
          where.isAvailable = true
        } else if (query.status === 'rented') {
          where.isAvailable = false
        }
      }

      // Lọc theo khoảng giá
      if (query.priceRange) {
        if (query.priceRange === 'under-3m') {
          where.price = { lt: 3000000 }
        } else if (query.priceRange === '3m-5m') {
          where.price = { gte: 3000000, lte: 5000000 }
        } else if (query.priceRange === 'over-5m') {
          where.price = { gt: 5000000 }
        }
      }

      // Lọc theo khoảng diện tích
      if (query.areaRange) {
        if (query.areaRange === 'under-20') {
          where.area = { lt: 20 }
        } else if (query.areaRange === '20-25') {
          where.area = { gte: 20, lte: 25 }
        } else if (query.areaRange === 'over-25') {
          where.area = { gt: 25 }
        }
      }

      if (query.ownerId) {
        const rentals = await this.prismaService.rental.findMany({
          where: { landlordId: query.ownerId },
          select: { id: true },
        })

        const rentalIds = rentals.map(rental => rental.id)

        if (rentalIds.length === 0) {
          return {
            data: [],
            totalItems: 0,
            page: query.page,
            limit: query.limit,
            totalPages: 0,
          }
        }

        where.rentalId = { in: rentalIds }
      }

      const [totalItems, data] = await Promise.all([
        this.prismaService.room.count({ where }),
        this.prismaService.room.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
      ])

      return {
        data: data.map(this.formatRoom),
        totalItems,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(totalItems / query.limit),
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async findById(id: number): Promise<RoomType | null> {
    try {
      const room = await this.prismaService.room.findUnique({
        where: { id },
        include: {
          roomAmenities: {
            include: {
              amenity: true,
            },
          },
          roomImages: true,
        },
      })
      return room ? this.formatRoom(room) : null
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async create({
    data,
    landlordId,
  }: {
    data: CreateRoomBodyType
    landlordId: number
  }): Promise<RoomType> {
    try {
      const { amenityIds, roomImages, ...roomData } = data

      // Kiểm tra xem rental có thuộc về landlord không
      const rental = await this.prismaService.rental.findFirst({
        where: {
          id: roomData.rentalId,
          landlordId: landlordId,
        },
      })

      if (!rental) {
        throw new InternalServerErrorException(
          'Nhà trọ không tồn tại hoặc không thuộc về người cho thuê này'
        )
      }

      const room = await this.prismaService.room.create({
        data: {
          ...roomData,
          ...(amenityIds &&
            amenityIds.length > 0 && {
              roomAmenities: {
                create: amenityIds.map(amenityId => ({
                  amenity: { connect: { id: amenityId } },
                })),
              },
            }),
        },
        include: {
          roomAmenities: {
            include: {
              amenity: true,
            },
          },
          roomImages: true,
        },
      })

      // Thêm hình ảnh phòng nếu có
      if (roomImages && roomImages.length > 0) {
        await this.prismaService.roomImage.createMany({
          data: roomImages.map(image => ({
            roomId: room.id,
            order: image.order || 0,
            imageUrl: image.imageUrl,
          })),
        })
      }

      // Lấy phòng đã tạo với tất cả thông tin
      const createdRoom = await this.prismaService.room.findUnique({
        where: { id: room.id },
        include: {
          roomAmenities: {
            include: {
              amenity: true,
            },
          },
          roomImages: true,
        },
      })

      return this.formatRoom(createdRoom)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async update({
    id,
    data,
  }: {
    id: number
    data: UpdateRoomBodyType
  }): Promise<RoomType> {
    try {
      const { amenityIds, roomImages, ...roomData } = data

      // Nếu có amenityIds, xóa tất cả liên kết hiện tại và tạo mới
      if (amenityIds) {
        // Xóa tất cả room amenities hiện tại
        await this.prismaService.roomAmenity.deleteMany({
          where: { roomId: id },
        })

        // Tạo mới roomAmenities nếu có amenityIds
        if (amenityIds.length > 0) {
          await this.prismaService.roomAmenity.createMany({
            data: amenityIds.map(amenityId => ({
              roomId: id,
              amenityId,
            })),
          })
        }
      }

      // Cập nhật thông tin cơ bản của phòng
      const room = await this.prismaService.room.update({
        where: { id },
        data: roomData,
      })

      // Nếu có cập nhật hình ảnh
      if (roomImages) {
        // Xóa tất cả hình ảnh hiện tại
        await this.prismaService.roomImage.deleteMany({
          where: { roomId: id },
        })

        // Thêm các hình ảnh mới
        if (roomImages.length > 0) {
          await this.prismaService.roomImage.createMany({
            data: roomImages.map(image => ({
              roomId: id,
              imageUrl: image.imageUrl,
              order: image.order || 0,
            })),
          })
        }
      }

      // Lấy phòng đã cập nhật với tất cả thông tin
      const updatedRoom = await this.prismaService.room.findUnique({
        where: { id },
        include: {
          roomAmenities: {
            include: {
              amenity: true,
            },
          },
          roomImages: true,
        },
      })

      return this.formatRoom(updatedRoom)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async delete({ id }: { id: number }): Promise<RoomType> {
    try {
      const room = await this.prismaService.room.delete({
        where: { id },
      })
      return this.formatRoom(room)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async createBulkRooms({
    data,
    landlordId,
  }: {
    data: CreateBulkRoomsBodyType
    landlordId: number
  }): Promise<CreateBulkRoomsResType> {
    try {
      const {
        amenityIds,
        roomImages,
        baseName,
        startNumber,
        count,
        ...baseRoomData
      } = data

      // Kiểm tra xem rental có thuộc về landlord không
      const rental = await this.prismaService.rental.findFirst({
        where: {
          id: baseRoomData.rentalId,
          landlordId: landlordId,
        },
      })

      if (!rental) {
        throw new InternalServerErrorException(
          'Nhà trọ không tồn tại hoặc không thuộc về người cho thuê này'
        )
      }

      // Tạo danh sách tên phòng với tên nhà trọ
      const roomTitles = Array.from(
        { length: count },
        (_, index) => `${baseName} ${startNumber + index} - ${rental.title}`
      )

      // Kiểm tra xem có phòng nào đã tồn tại với tên tương tự không
      const existingRooms = await this.prismaService.room.findMany({
        where: {
          rentalId: baseRoomData.rentalId,
          title: {
            in: roomTitles,
          },
        },
      })

      if (existingRooms.length > 0) {
        throw new InternalServerErrorException(
          `Một số phòng đã tồn tại: ${existingRooms.map(room => room.title).join(', ')}`
        )
      }

      // Tạo danh sách phòng cần tạo
      const roomsToCreate = Array.from({ length: count }, (_, index) => ({
        ...baseRoomData,
        title: roomTitles[index],
      }))

      // Sử dụng transaction để đảm bảo tính nhất quán với timeout tăng lên
      const createdRooms = await this.prismaService.$transaction(
        async prisma => {
          // Tạo tất cả phòng cùng lúc để tối ưu performance
          await prisma.room.createMany({
            data: roomsToCreate,
          })

          // Lấy các phòng vừa tạo
          const rooms = await prisma.room.findMany({
            where: {
              rentalId: baseRoomData.rentalId,
              title: {
                in: roomsToCreate.map(room => room.title),
              },
            },
            orderBy: { id: 'asc' },
          })

          // Nếu có amenities, tạo roomAmenities cho tất cả phòng
          if (amenityIds && amenityIds.length > 0) {
            const roomAmenityData = rooms.flatMap(room =>
              amenityIds.map(amenityId => ({
                roomId: room.id,
                amenityId,
              }))
            )

            if (roomAmenityData.length > 0) {
              await prisma.roomAmenity.createMany({
                data: roomAmenityData,
              })
            }
          }

          // Nếu có hình ảnh, tạo roomImages cho tất cả phòng
          if (roomImages && roomImages.length > 0) {
            const roomImageData = rooms.flatMap(room =>
              roomImages.map(image => ({
                roomId: room.id,
                order: image.order || 0,
                imageUrl: image.imageUrl,
              }))
            )

            if (roomImageData.length > 0) {
              await prisma.roomImage.createMany({
                data: roomImageData,
              })
            }
          }

          // Lấy lại rooms với đầy đủ thông tin
          return await prisma.room.findMany({
            where: {
              id: { in: rooms.map(room => room.id) },
            },
            include: {
              roomAmenities: {
                include: {
                  amenity: true,
                },
              },
              roomImages: true,
            },
            orderBy: { createdAt: 'desc' },
          })
        },
        {
          timeout: 30000, // Tăng timeout lên 30 giây
        }
      )

      return {
        message: `Đã tạo thành công ${createdRooms.length} phòng trọ`,
        createdRooms: createdRooms.map(this.formatRoom),
        totalCreated: createdRooms.length,
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
