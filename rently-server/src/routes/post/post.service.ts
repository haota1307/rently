import { Injectable } from '@nestjs/common'
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

  async listByUserId(pagination: GetPostsQueryType, userId: number) {
    return this.rentalPostRepo.listByUserId(pagination, userId)
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

  async delete({ id, deletedById }: { id: number; deletedById: number }) {
    try {
      await this.rentalPostRepo.delete({ id })
      return { message: 'Delete successfully' }
    } catch (error) {
      throw NotFoundRecordException
    }
  }
}
