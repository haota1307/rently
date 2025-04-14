import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Body,
} from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { UploadService } from './cloudinary.service'

@Controller('upload')
export class UploadController {
  constructor(private readonly cloudinaryService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadImage(file, 'uploads')
    return {
      url: result.secure_url,
      public_id: result.public_id,
    }
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    const uploadPromises = files.map(file =>
      this.cloudinaryService.uploadImage(file, 'uploads')
    )
    const results = await Promise.all(uploadPromises)
    return results.map(result => ({
      url: result.secure_url,
      public_id: result.public_id,
    }))
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadVideo(
      file,
      'uploads/videos'
    )
    return {
      url: result.secure_url,
      public_id: result.public_id,
      size: result.bytes,
    }
  }

  /**
   * Upload file cho tin nhắn
   */
  @Post('message-file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMessageFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('conversationId') conversationId: string
  ) {
    const result = await this.cloudinaryService.uploadMessageFile(
      file,
      `messages/${conversationId || 'general'}`
    )

    // Xác định loại file dựa trên MIME type
    let fileType = ''
    let thumbnailUrl = ''

    if (file.mimetype.startsWith('image/')) {
      fileType = 'IMAGE'
      thumbnailUrl = result.secure_url
    } else if (file.mimetype.startsWith('video/')) {
      fileType = 'VIDEO'
      thumbnailUrl = result.secure_url
        .replace('/video/', '/image/')
        .replace(/\.[^/.]+$/, '.jpg')
    } else if (file.mimetype.startsWith('audio/')) {
      fileType = 'AUDIO'
    } else if (
      file.mimetype === 'application/pdf' ||
      file.mimetype.includes('word') ||
      file.mimetype.includes('excel') ||
      file.mimetype.includes('powerpoint') ||
      file.mimetype.includes('openxmlformats')
    ) {
      fileType = 'DOCUMENT'
    } else {
      fileType = 'FILE'
    }

    return {
      url: result.secure_url,
      fileName: file.originalname,
      fileSize: result.bytes,
      fileType: file.mimetype,
      thumbnailUrl: thumbnailUrl || undefined,
      type: fileType,
    }
  }
}
