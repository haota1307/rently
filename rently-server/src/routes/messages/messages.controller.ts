import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CreateConversationBodyDTO,
  CreateMessageBodyDTO,
  FileUploadResponseSchema,
  GetConversationsQueryDTO,
  GetConversationsResSchema,
  GetMessagesParamsDTO,
  GetMessagesQueryDTO,
  GetMessagesResSchema,
  MessageType,
  EditMessageDTO,
} from './messages.dto'
import { MessagesService } from './messages.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { UploadService } from '../upload/cloudinary.service'

@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly uploadService: UploadService
  ) {}

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
   * Upload file cho tin nhắn
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ZodSerializerDto(FileUploadResponseSchema)
  async uploadFile(
    @ActiveUser('userId') userId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('conversationId') conversationId: string
  ) {
    // Kiểm tra quyền truy cập cuộc trò chuyện
    await this.messagesService.checkConversationAccess(
      userId,
      parseInt(conversationId)
    )

    // Upload file lên Cloudinary
    const result = await this.uploadService.uploadMessageFile(
      file,
      `messages/${conversationId}`
    )

    // Xác định loại file dựa trên MIME type
    const fileType = this.getFileType(file.mimetype)

    // Xác định thumbnail URL nếu là hình ảnh hoặc video
    let thumbnailUrl: string | undefined = undefined
    if (fileType === MessageType.IMAGE) {
      thumbnailUrl = result.secure_url
    } else if (fileType === MessageType.VIDEO) {
      // Cloudinary tự động tạo thumbnail cho video
      thumbnailUrl = result.secure_url
        .replace('/video/', '/image/')
        .replace(/\.[^/.]+$/, '.jpg')
    }

    return {
      url: result.secure_url,
      fileName: file.originalname,
      fileSize: result.bytes,
      fileType: file.mimetype,
      thumbnailUrl,
    }
  }

  /**
   * Xác định loại file dựa trên MIME type
   */
  private getFileType(mimeType: string): MessageType {
    if (mimeType.startsWith('image/')) {
      return MessageType.IMAGE
    } else if (mimeType.startsWith('video/')) {
      return MessageType.VIDEO
    } else if (mimeType.startsWith('audio/')) {
      return MessageType.AUDIO
    } else if (
      mimeType === 'application/pdf' ||
      mimeType.includes('word') ||
      mimeType.includes('excel') ||
      mimeType.includes('powerpoint') ||
      mimeType.includes('openxmlformats')
    ) {
      return MessageType.DOCUMENT
    } else {
      return MessageType.FILE
    }
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

  /**
   * Sửa nội dung tin nhắn
   */
  @Put(':messageId/edit')
  editMessage(
    @ActiveUser('userId') userId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() body: EditMessageDTO
  ) {
    return this.messagesService.editMessage(userId, messageId, body.content)
  }

  /**
   * Xóa tin nhắn (soft delete)
   */
  @Put(':messageId/delete')
  deleteMessage(
    @ActiveUser('userId') userId: number,
    @Param('messageId', ParseIntPipe) messageId: number
  ) {
    return this.messagesService.deleteMessage(userId, messageId)
  }
}
