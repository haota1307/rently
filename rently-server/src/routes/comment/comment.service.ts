import { Injectable, NotFoundException } from '@nestjs/common'
import { CommentRepo } from './comment.repo'
import {
  CommentType,
  CreateCommentBodyType,
  GetCommentRepliesQueryType,
  GetCommentsQueryType,
  GetCommentsResType,
  UpdateCommentBodyType,
} from './comment.schema'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Injectable()
export class CommentService {
  constructor(private readonly commentRepo: CommentRepo) {}

  async getComments(query: GetCommentsQueryType): Promise<GetCommentsResType> {
    return await this.commentRepo.getComments(query)
  }

  async getReplies(
    query: GetCommentRepliesQueryType
  ): Promise<GetCommentsResType> {
    return await this.commentRepo.getReplies(query)
  }

  async createComment(
    userId: number,
    data: CreateCommentBodyType
  ): Promise<CommentType> {
    try {
      return await this.commentRepo.createComment(userId, data)
    } catch (error) {
      if (error.message === 'Bài đăng không tồn tại') {
        throw new NotFoundException('Bài đăng không tồn tại')
      }
      if (error.message === 'Bình luận gốc không tồn tại') {
        throw new NotFoundException('Bình luận gốc không tồn tại')
      }
      if (error.message === 'Bình luận gốc không thuộc bài đăng này') {
        throw new NotFoundException('Bình luận gốc không thuộc bài đăng này')
      }
      throw error
    }
  }

  async updateComment(
    commentId: number,
    userId: number,
    data: UpdateCommentBodyType
  ): Promise<CommentType> {
    return await this.commentRepo.updateComment(commentId, userId, data)
  }

  async deleteComment(
    commentId: number,
    userId: number
  ): Promise<MessageResDTO> {
    await this.commentRepo.deleteComment(commentId, userId)
    return {
      message: 'Xóa bình luận thành công',
    }
  }

  async getCommentById(commentId: number): Promise<CommentType> {
    const comment = await this.commentRepo.getCommentById(commentId)
    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại')
    }
    return comment
  }
}
