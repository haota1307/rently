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
import { NotificationService } from 'src/routes/notification/notification.service'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepo: CommentRepo,
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

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
      // Chuyển đổi data để phù hợp với tham số của phương thức create
      const createData = {
        content: data.content,
        postId: data.postId,
        parentId: data.parentId,
      }

      // Sử dụng phương thức create để đảm bảo thông báo được gửi
      return await this.create(createData, userId)
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

  async create(
    data: { content: string; postId: number; parentId?: number | null },
    userId: number
  ) {
    try {
      // Lấy thông tin người bình luận
      const commenter = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true },
      })

      if (!commenter) {
        throw new Error('Không tìm thấy thông tin người dùng')
      }

      // Lấy thông tin bài đăng
      const post = await this.prismaService.rentalPost.findUnique({
        where: { id: data.postId },
        select: { id: true, title: true, landlordId: true },
      })

      if (!post) {
        throw new Error('Không tìm thấy thông tin bài đăng')
      }

      // Tạo bình luận
      const comment = await this.commentRepo.createComment(userId, {
        ...data,
      })

      if (!data.parentId && post.landlordId !== userId) {
        console.log('Sending comment notification to landlord:', {
          landlordId: post.landlordId,
          commenterName: commenter.name,
          postId: post.id,
          postTitle: post.title,
        })

        await this.notificationService.notifyNewComment(
          post.landlordId,
          commenter.name,
          post.id,
          post.title
        )
      }

      // Nếu là reply, gửi thông báo cho người bình luận gốc
      if (data.parentId) {
        const parentComment = await this.prismaService.comment.findUnique({
          where: { id: data.parentId },
          select: { userId: true },
        })

        if (parentComment && parentComment.userId !== userId) {
          // Thông báo cho người đã bình luận gốc
          const parentCommenter = await this.prismaService.user.findUnique({
            where: { id: parentComment.userId },
          })

          if (parentCommenter) {
            await this.notificationService.notifyNewComment(
              parentComment.userId,
              commenter.name,
              post.id,
              post.title
            )
          }
        }
      }

      return comment
    } catch (error) {
      throw error
    }
  }
}
