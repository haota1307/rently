import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateConversationBodyDTO,
  CreateMessageBodyDTO,
  GetConversationsQueryDTO,
  GetConversationsResSchema,
  GetMessagesParamsDTO,
  GetMessagesQueryDTO,
  GetMessagesResSchema,
} from './messages.dto'
import { MessagesService } from './messages.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Lấy danh sách cuộc trò chuyện của người dùng
   */
  @Get('conversations')
  @ZodSerializerDto(GetConversationsResSchema)
  getConversations(
    @ActiveUser('userId') userId: number,
    @Query() query: GetConversationsQueryDTO
  ) {
    return this.messagesService.getConversations(userId, query)
  }

  /**
   * Lấy tin nhắn của một cuộc trò chuyện
   */
  @Get('conversations/:conversationId')
  @ZodSerializerDto(GetMessagesResSchema)
  getMessages(
    @ActiveUser('userId') userId: number,
    @Param() params: GetMessagesParamsDTO,
    @Query() query: GetMessagesQueryDTO
  ) {
    return this.messagesService.getMessages(userId, params, query)
  }

  /**
   * Tạo cuộc trò chuyện mới
   */
  @Post('conversations')
  createConversation(
    @ActiveUser('userId') userId: number,
    @Body() body: CreateConversationBodyDTO
  ) {
    return this.messagesService.createConversation(userId, body)
  }

  /**
   * Gửi tin nhắn mới
   */
  @Post('send')
  createMessage(
    @ActiveUser('userId') userId: number,
    @Body() body: CreateMessageBodyDTO
  ) {
    return this.messagesService.createMessage(userId, body)
  }

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  @Put('conversations/:conversationId/mark-as-read')
  markAsRead(
    @ActiveUser('userId') userId: number,
    @Param() params: GetMessagesParamsDTO
  ) {
    return this.messagesService.markAsRead(userId, params.conversationId)
  }
}
