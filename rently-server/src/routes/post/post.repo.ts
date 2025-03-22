import { Injectable, InternalServerErrorException } from '@nestjs/common'
import {
  CreatePostBodyType,
  GetPostsQueryType,
  GetPostsResType,
  PostType,
  UpdatePostBodyType,
} from 'src/routes/post/post.model'
import { PrismaService } from 'src/shared/services/prisma.service'

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
      },
    } as PostType
  }

  async list(pagination: GetPostsQueryType): Promise<GetPostsResType> {
    try {
      const skip = (pagination.page - 1) * pagination.limit
      const take = pagination.limit

      const [totalItems, data] = await Promise.all([
        this.prismaService.rentalPost.count(),
        this.prismaService.rentalPost.findMany({
          skip,
          take,
          include: { rental: true, landlord: true },
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
        include: { rental: true, landlord: true },
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
        include: { rental: true, landlord: true },
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
        include: { rental: true, landlord: true },
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
        include: { rental: true, landlord: true },
      })
      return this.formatPost(post)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
