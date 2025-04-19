import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import {
  CreatePostBodyType,
  GetPostsQueryType,
  UpdatePostBodyType,
} from 'src/routes/post/post.model'
import { PostRepo } from 'src/routes/post/post.repo'

import { NotFoundRecordException } from 'src/shared/error'

@Injectable()
export class PostService {
  constructor(private readonly rentalPostRepo: PostRepo) {}

  async list(pagination: GetPostsQueryType) {
    return this.rentalPostRepo.list(pagination)
  }

  async listByUserId(query: GetPostsQueryType, userId: number) {
    return this.rentalPostRepo.listByUserId(query, userId)
  }

  async findById(id: number) {
    const rentalPost = await this.rentalPostRepo.findById(id)
    if (!rentalPost) {
      throw NotFoundRecordException
    }
    return rentalPost
  }

  async create({
    data,
    landlordId,
  }: {
    data: CreatePostBodyType
    landlordId: number
  }) {
    return this.rentalPostRepo.create({ data, landlordId })
  }

  async update({
    id,
    data,
    updatedById,
  }: {
    id: number
    data: UpdatePostBodyType
    updatedById: number
  }) {
    try {
      return await this.rentalPostRepo.update({ id, data })
    } catch (error) {
      throw NotFoundRecordException
    }
  }

  async delete(id: number, userId: number) {
    const post = await this.rentalPostRepo.findById(id)

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài đăng')
    }

    if (post.landlordId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bài đăng này')
    }

    await this.rentalPostRepo.delete({ id })
  }

  async getSimilarByPrice(postId: number, limit: number = 4) {
    // Lấy thông tin bài đăng
    const post = await this.rentalPostRepo.findById(postId)

    if (!post || !post.room) {
      return {
        data: [],
        totalItems: 0,
        page: 1,
        limit,
        totalPages: 0,
      }
    }

    // Tính toán phạm vi giá (+/- 20%)
    const originalPrice = post.room.price
    const minPrice = Math.floor(originalPrice * 0.8) // 20% thấp hơn
    const maxPrice = Math.ceil(originalPrice * 1.2) // 20% cao hơn

    // Lấy các bài đăng có giá tương tự
    return this.rentalPostRepo.getSimilarByPrice({
      postId,
      minPrice,
      maxPrice,
      limit,
    })
  }

  async getSameRental(
    rentalId: number,
    excludePostId: number,
    limit: number = 4
  ) {
    // Lấy các bài đăng khác từ cùng một nhà trọ
    return this.rentalPostRepo.getSameRental({
      rentalId,
      excludePostId,
      limit,
    })
  }
}
