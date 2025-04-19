import { Injectable, InternalServerErrorException } from '@nestjs/common'
import {
  CreatePostBodyType,
  GetPostsQueryType,
  GetPostsResType,
  PostType,
  UpdatePostBodyType,
} from 'src/routes/post/post.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class PostRepo {
  constructor(private prismaService: PrismaService) {}

  private formatPost = (post: any): PostType => {
    if (!post.rental) {
      throw new Error('Missing rental information in post')
    }
    return {
      ...post,
      pricePaid: post.pricePaid.toNumber(),
      rental: {
        ...post.rental,
        lat: post.rental.lat.toNumber(),
        lng: post.rental.lng.toNumber(),
        distance: post.rental.distance
          ? post.rental.distance instanceof Decimal
            ? post.rental.distance.toNumber()
            : post.rental.distance
          : 0,
      },
    } as PostType
  }

  async list(pagination: GetPostsQueryType): Promise<GetPostsResType> {
    try {
      const skip = (pagination.page - 1) * pagination.limit
      const take = pagination.limit
      const whereClause: any = {}

      if (pagination.title) {
        whereClause.title = {
          contains: pagination.title,
          mode: 'insensitive',
        }
      }

      if (pagination.startDate) {
        whereClause.startDate = { gte: new Date(pagination.startDate) }
      }

      if (pagination.endDate) {
        whereClause.endDate = { lte: new Date(pagination.endDate) }
      }

      if (pagination.status) {
        whereClause.status = pagination.status
      }

      const [totalItems, data] = await Promise.all([
        this.prismaService.rentalPost.count({ where: whereClause }),
        this.prismaService.rentalPost.findMany({
          skip,
          take,
          where: whereClause,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            rental: {
              include: {
                rentalImages: true,
              },
            },
            landlord: true,
            room: {
              include: {
                roomImages: true,
                roomAmenities: {
                  include: {
                    amenity: true,
                  },
                },
              },
            },
          },
        }),
      ])

      return {
        data: data.map(this.formatPost),
        totalItems,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(totalItems / pagination.limit),
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async listByUserId(
    pagination: GetPostsQueryType,
    userId: number
  ): Promise<GetPostsResType> {
    try {
      const skip = (pagination.page - 1) * pagination.limit
      const take = pagination.limit

      // Thêm điều kiện lọc theo userId (landlordId)
      const whereClause: any = {
        landlordId: userId,
      }

      if (pagination.title) {
        whereClause.title = {
          contains: pagination.title,
          mode: 'insensitive',
        }
      }

      if (pagination.startDate) {
        whereClause.startDate = { gte: new Date(pagination.startDate) }
      }

      if (pagination.endDate) {
        whereClause.endDate = { lte: new Date(pagination.endDate) }
      }

      if (pagination.status) {
        whereClause.status = pagination.status
      }

      const [totalItems, data] = await Promise.all([
        this.prismaService.rentalPost.count({ where: whereClause }),
        this.prismaService.rentalPost.findMany({
          skip,
          take,
          where: whereClause,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            rental: {
              include: {
                rentalImages: true,
              },
            },
            landlord: true,
            room: {
              include: {
                roomImages: true,
                roomAmenities: {
                  include: {
                    amenity: true,
                  },
                },
              },
            },
          },
        }),
      ])

      return {
        data: data.map(this.formatPost),
        totalItems,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(totalItems / pagination.limit),
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async findById(id: number): Promise<PostType | null> {
    try {
      const post = await this.prismaService.rentalPost.findUnique({
        where: { id },
        include: {
          rental: {
            include: {
              rentalImages: true,
            },
          },
          landlord: true,
          room: {
            include: {
              roomImages: true,
              roomAmenities: {
                include: {
                  amenity: true,
                },
              },
            },
          },
        },
      })
      return post ? this.formatPost(post) : null
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async create({
    data,
    landlordId,
  }: {
    data: CreatePostBodyType
    landlordId: number
  }): Promise<PostType> {
    try {
      const post = await this.prismaService.rentalPost.create({
        data: { ...data, landlordId, createdAt: new Date() },
        include: {
          rental: {
            include: {
              rentalImages: true,
            },
          },
          landlord: true,
          room: {
            include: {
              roomImages: true,
              roomAmenities: {
                include: {
                  amenity: true,
                },
              },
            },
          },
        },
      })
      return this.formatPost(post)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async update({
    id,
    data,
  }: {
    id: number
    data: UpdatePostBodyType
  }): Promise<PostType> {
    try {
      const post = await this.prismaService.rentalPost.update({
        where: { id },
        data,
        include: {
          rental: {
            include: {
              rentalImages: true,
            },
          },
          landlord: true,
          room: {
            include: {
              roomImages: true,
              roomAmenities: {
                include: {
                  amenity: true,
                },
              },
            },
          },
        },
      })
      return this.formatPost(post)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async delete({ id }: { id: number }): Promise<PostType> {
    try {
      const post = await this.prismaService.rentalPost.delete({
        where: { id },
        include: {
          rental: {
            include: {
              rentalImages: true,
            },
          },
          landlord: true,
          room: {
            include: {
              roomImages: true,
              roomAmenities: {
                include: {
                  amenity: true,
                },
              },
            },
          },
        },
      })
      return this.formatPost(post)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async getSimilarByPrice({
    postId,
    minPrice,
    maxPrice,
    limit = 4,
  }: {
    postId: number
    minPrice: number
    maxPrice: number
    limit: number
  }) {
    // Lấy tổng số bài đăng phù hợp với điều kiện
    const totalItems = await this.prismaService.rentalPost.count({
      where: {
        id: { not: postId }, // Loại trừ chính bài đăng hiện tại
        status: 'ACTIVE',
        room: {
          price: {
            gte: minPrice,
            lte: maxPrice,
          },
          isAvailable: true, // Chỉ lấy các phòng còn trống
        },
      },
    })

    // Lấy danh sách bài đăng
    const posts = await this.prismaService.rentalPost.findMany({
      where: {
        id: { not: postId }, // Loại trừ chính bài đăng hiện tại
        status: 'ACTIVE',
        room: {
          price: {
            gte: minPrice,
            lte: maxPrice,
          },
          isAvailable: true, // Chỉ lấy các phòng còn trống
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc', // Lấy bài đăng mới nhất
      },
      include: {
        room: {
          include: {
            roomImages: true,
            roomAmenities: {
              include: {
                amenity: true,
              },
            },
          },
        },
        landlord: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        rental: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
      },
    })

    return {
      data: posts,
      totalItems,
      page: 1,
      limit,
      totalPages: Math.ceil(totalItems / limit),
    }
  }

  async getSameRental({
    rentalId,
    excludePostId,
    limit = 4,
  }: {
    rentalId: number
    excludePostId: number
    limit: number
  }) {
    // Lấy tổng số bài đăng từ cùng một nhà trọ
    const totalItems = await this.prismaService.rentalPost.count({
      where: {
        id: { not: excludePostId }, // Loại trừ bài đăng hiện tại
        rentalId: rentalId,
        status: 'ACTIVE',
        room: {
          isAvailable: true, // Chỉ lấy các phòng còn trống
        },
      },
    })

    // Lấy danh sách bài đăng
    const posts = await this.prismaService.rentalPost.findMany({
      where: {
        id: { not: excludePostId }, // Loại trừ bài đăng hiện tại
        rentalId: rentalId,
        status: 'ACTIVE',
        room: {
          isAvailable: true, // Chỉ lấy các phòng còn trống
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc', // Lấy bài đăng mới nhất
      },
      include: {
        room: {
          include: {
            roomImages: true,
            roomAmenities: {
              include: {
                amenity: true,
              },
            },
          },
        },
        landlord: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        rental: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
      },
    })

    return {
      data: posts,
      totalItems,
      page: 1,
      limit,
      totalPages: Math.ceil(totalItems / limit),
    }
  }
}
