import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  CommentType,
  CreateCommentBodyType,
  GetCommentRepliesQueryType,
  GetCommentsQueryType,
  GetCommentsResType,
  UpdateCommentBodyType,
} from './comment.schema'
import { isNotFoundPrismaError } from 'src/shared/helpers'
import { NotFoundRecordException } from 'src/shared/error'

@Injectable()
export class CommentRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async getComments(query: GetCommentsQueryType): Promise<GetCommentsResType> {
    try {
      const { page, limit, postId } = query
      const skip = (page - 1) * limit
      const take = limit

      // Đếm số lượng bình luận gốc
      const totalItems = await this.prismaService.comment.count({
        where: {
          postId,
          parentId: null,
          deletedAt: null,
        },
      })

      // Lấy bình luận gốc và thông tin người dùng
      const comments = await this.prismaService.comment.findMany({
        where: {
          postId,
          parentId: null,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      })

      // Lấy replies cho mỗi comment
      const commentsWithReplies = await Promise.all(
        comments.map(async comment => {
          const replies = await this.prismaService.comment.findMany({
            where: {
              parentId: comment.id,
              deletedAt: null,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          })

          return {
            ...comment,
            replies,
          }
        })
      )

      return {
        data: commentsWithReplies as unknown as CommentType[],
        totalItems,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit),
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async getReplies(
    query: GetCommentRepliesQueryType
  ): Promise<GetCommentsResType> {
    try {
      const { page, limit, parentId } = query
      const skip = (page - 1) * limit
      const take = limit

      // Đếm số lượng replies
      const totalItems = await this.prismaService.comment.count({
        where: {
          parentId,
          deletedAt: null,
        },
      })

      // Lấy danh sách replies với thông tin người dùng
      const replies = await this.prismaService.comment.findMany({
        where: {
          parentId,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        skip,
        take,
      })

      return {
        data: replies as unknown as CommentType[],
        totalItems,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit),
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async createComment(
    userId: number,
    data: CreateCommentBodyType
  ): Promise<CommentType> {
    try {
      // Kiểm tra xem bài đăng có tồn tại không
      const postExists = await this.prismaService.rentalPost.findUnique({
        where: { id: data.postId },
        select: { id: true },
      })

      if (!postExists) {
        throw new Error('Bài đăng không tồn tại')
      }

      // Nếu có parentId, kiểm tra xem bình luận gốc có tồn tại không
      if (data.parentId) {
        const parentComment = await this.prismaService.comment.findUnique({
          where: { id: data.parentId },
          select: { id: true, postId: true },
        })

        if (!parentComment) {
          throw new Error('Bình luận gốc không tồn tại')
        }

        // Đảm bảo rằng bình luận gốc thuộc cùng một bài đăng
        if (parentComment.postId !== data.postId) {
          throw new Error('Bình luận gốc không thuộc bài đăng này')
        }
      }

      // Tạo bình luận mới
      const comment = await this.prismaService.comment.create({
        data: {
          content: data.content,
          userId: userId,
          postId: data.postId,
          parentId: data.parentId || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      })

      return comment as unknown as CommentType
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async updateComment(
    commentId: number,
    userId: number,
    data: UpdateCommentBodyType
  ): Promise<CommentType> {
    try {
      // Kiểm tra xem bình luận có tồn tại và thuộc về người dùng hiện tại không
      const commentExists = await this.prismaService.comment.findFirst({
        where: {
          id: commentId,
          userId,
          deletedAt: null,
        },
      })

      if (!commentExists) {
        throw NotFoundRecordException
      }

      // Cập nhật bình luận
      const updatedComment = await this.prismaService.comment.update({
        where: {
          id: commentId,
        },
        data: {
          content: data.content,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      })

      return updatedComment as unknown as CommentType
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw new InternalServerErrorException(error.message)
    }
  }

  async deleteComment(commentId: number, userId: number): Promise<void> {
    try {
      // Tìm bình luận để đảm bảo nó thuộc về người dùng hiện tại
      const commentExists = await this.prismaService.comment.findFirst({
        where: {
          id: commentId,
          userId,
          deletedAt: null,
        },
      })

      if (!commentExists) {
        throw NotFoundRecordException
      }

      // Soft delete bình luận
      const now = new Date()
      await this.prismaService.comment.update({
        where: {
          id: commentId,
        },
        data: {
          deletedAt: now,
        },
      })

      // Soft delete tất cả các phản hồi của bình luận này
      await this.prismaService.comment.updateMany({
        where: {
          parentId: commentId,
          deletedAt: null,
        },
        data: {
          deletedAt: now,
        },
      })
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw NotFoundRecordException
      }
      throw new InternalServerErrorException(error.message)
    }
  }

  async getCommentById(commentId: number): Promise<CommentType | null> {
    try {
      const comment = await this.prismaService.comment.findFirst({
        where: {
          id: commentId,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      })

      if (!comment) {
        return null
      }

      return comment as unknown as CommentType
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
