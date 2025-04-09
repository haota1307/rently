import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { CommentService } from './comment.service'
import {
  CommentParamDTO,
  CreateCommentBodyDTO,
  GetCommentRepliesQueryDTO,
  GetCommentsQueryDTO,
  UpdateCommentBodyDTO,
} from './comment.dto'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  async getComments(@Query() query: GetCommentsQueryDTO) {
    return await this.commentService.getComments(query)
  }

  @Get('replies')
  async getReplies(@Query() query: GetCommentRepliesQueryDTO) {
    return await this.commentService.getReplies(query)
  }

  @Post()
  async createComment(
    @ActiveUser('userId') userId: number,
    @Body() body: CreateCommentBodyDTO
  ) {
    return await this.commentService.createComment(userId, body)
  }

  @Put(':commentId')
  async updateComment(
    @ActiveUser('userId') userId: number,
    @Param() param: CommentParamDTO,
    @Body() body: UpdateCommentBodyDTO
  ) {
    return await this.commentService.updateComment(
      param.commentId,
      userId,
      body
    )
  }

  @Delete(':commentId')
  async deleteComment(
    @ActiveUser('userId') userId: number,
    @Param() param: CommentParamDTO
  ) {
    return await this.commentService.deleteComment(param.commentId, userId)
  }

  @Get(':commentId')
  async getCommentById(@Param() param: CommentParamDTO) {
    return await this.commentService.getCommentById(param.commentId)
  }
}
