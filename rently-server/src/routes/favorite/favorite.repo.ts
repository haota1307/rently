import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  CreateFavoriteBodyType,
  FavoriteType,
  GetUserFavoritesQueryType,
  GetUserFavoritesResType,
} from './favorite.model'
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
            post: {
              include: {
                room: {
                  include: {
                    rental: {
                      include: {
                        rentalImages: { orderBy: { order: 'asc' } },
                      },
                    },
                    roomImages: { orderBy: { order: 'asc' } },
                    roomAmenities: {
                      include: {
                        amenity: true,
                      },
                    },
                  },
                },
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

      // Format the data for each favorite
      const formattedFavorites = favorites
        .filter(favorite => favorite.post && favorite.post.room)
        .map(favorite => ({
          ...favorite,
          post: {
            ...favorite.post!,
            deposit: toNumber(favorite.post!.deposit),
            room: {
              ...favorite.post!.room!,
              price: toNumber(favorite.post!.room!.price),
              rental: {
                ...favorite.post!.room!.rental,
                lat: toNumber(favorite.post!.room!.rental.lat),
                lng: toNumber(favorite.post!.room!.rental.lng),
                distance: favorite.post!.room!.rental.distance
                  ? toNumber(favorite.post!.room!.rental.distance)
                  : null,
              },
            },
          },
        }))

      return {
        data: formattedFavorites,
        totalItems,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(totalItems / query.limit),
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async create(userId: number, data: CreateFavoriteBodyType) {
    try {
      // Kiểm tra bài đăng có tồn tại không
      const post = await this.prismaService.rentalPost.findUnique({
        where: { id: data.postId },
        include: {
          room: {
            include: {
              rental: true,
            },
          },
        },
      })

      if (!post) {
        throw new Error('Bài đăng không tồn tại')
      }

      // Use rentalId from payload or extract from post data
      const rentalId = data.rentalId || post.room.rental.id

      return await this.prismaService.favorite.create({
        data: {
          userId,
          postId: data.postId,
          rentalId,
        },
      })
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Bài đăng không tồn tại')
      }
      throw new InternalServerErrorException(error.message)
    }
  }

  async delete(id: number, userId: number) {
    try {
      return await this.prismaService.favorite.delete({
        where: {
          id,
          userId,
        },
      })
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Favorite không tồn tại')
      }
      throw new InternalServerErrorException(error.message)
    }
  }

  async deleteByPostId(userId: number, postId: number) {
    try {
      return await this.prismaService.favorite.deleteMany({
        where: {
          userId,
          postId,
        },
      })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async checkUserFavorite(userId: number, postId: number) {
    try {
      return await this.prismaService.favorite.findFirst({
        where: {
          userId,
          postId,
        },
      })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
