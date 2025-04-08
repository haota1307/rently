import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  CreateFavoriteBodyType,
  FavoriteType,
  GetUserFavoritesQueryType,
  GetUserFavoritesResType,
} from 'src/shared/models/shared-favorite.model'
import { isNotFoundPrismaError, toNumber } from 'src/shared/helpers'
import { NotFoundRecordException } from 'src/shared/error'

@Injectable()
export class FavoriteRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async getUserFavorites(
    userId: number,
    query: GetUserFavoritesQueryType
  ): Promise<GetUserFavoritesResType> {
    try {
      const skip = (query.page - 1) * query.limit
      const take = query.limit

      const [totalItems, favorites] = await Promise.all([
        this.prismaService.favorite.count({
          where: {
            userId,
          },
        }),
        this.prismaService.favorite.findMany({
          where: {
            userId,
          },
          include: {
            rental: {
              include: {
                rentalImages: true,
                rooms: true,
              },
            },
          },
          skip,
          take,
          orderBy: {
            createdAt: 'desc',
          },
        }),
      ])

      // Format the rental data in each favorite
      const formattedFavorites = favorites.map(favorite => {
        if (favorite.rental) {
          return {
            ...favorite,
            rental: {
              ...favorite.rental,
              lat: toNumber(favorite.rental.lat),
              lng: toNumber(favorite.rental.lng),
              distance: favorite.rental.distance
                ? toNumber(favorite.rental.distance)
                : null,
              rooms: favorite.rental.rooms.map(room => ({
                ...room,
                price: toNumber(room.price),
              })),
            },
          }
        }
        return favorite
      })

      return {
        data: formattedFavorites as FavoriteType[],
        totalItems,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(totalItems / query.limit),
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async create(
    userId: number,
    data: CreateFavoriteBodyType
  ): Promise<FavoriteType> {
    try {
      // Kiểm tra xem rental có tồn tại không
      const rental = await this.prismaService.rental.findUnique({
        where: {
          id: data.rentalId,
        },
      })

      if (!rental) {
        throw new Error('Nhà trọ không tồn tại')
      }

      return await this.prismaService.favorite.create({
        data: {
          userId,
          rentalId: data.rentalId,
        },
      })
    } catch (error) {
      // Check if the error is a unique constraint violation
      if (error.code === 'P2002') {
        throw new Error('Bạn đã lưu tin này rồi')
      }
      throw new InternalServerErrorException(error.message)
    }
  }

  async delete(id: number, userId: number): Promise<void> {
    try {
      await this.prismaService.favorite.delete({
        where: {
          id,
          userId,
        },
      })
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw new InternalServerErrorException(error.message)
    }
  }

  async checkUserFavorite(
    userId: number,
    rentalId: number
  ): Promise<FavoriteType | null> {
    try {
      return await this.prismaService.favorite.findFirst({
        where: {
          userId,
          rentalId,
        },
      })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async deleteByRentalId(userId: number, rentalId: number): Promise<void> {
    try {
      await this.prismaService.favorite.deleteMany({
        where: {
          userId,
          rentalId,
        },
      })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
