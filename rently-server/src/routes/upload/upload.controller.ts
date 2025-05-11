import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Body,
  Req,
  Res,
  Next,
  BadRequestException,
  UnsupportedMediaTypeException,
} from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { UploadService } from './cloudinary.service'
import { Request, Response, NextFunction } from 'express'

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
    // Kiểm tra loại file cho phép
    const allowedMimeTypes = [
      // Document
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Excel
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // PowerPoint
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Text
      'text/plain',
      'text/csv',
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Video - có thể bỏ nếu không muốn cho phép video
      'video/mp4',
      'video/webm',
      'video/ogg',
    ]

    // Nếu loại file không được phép, trả về lỗi
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new UnsupportedMediaTypeException(
        `Loại file không được hỗ trợ: ${file.mimetype}. Chỉ chấp nhận các loại file văn bản phổ biến: PDF, Word, Excel, PowerPoint, CSV, hình ảnh và video.`
      )
    }

    const result = await this.cloudinaryService.uploadMessageFile(
      file,
      `messages/${conversationId || 'general'}`
    )

    let fileType = ''
    let thumbnailUrl = ''
    let downloadUrl = result.secure_url

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

      // Xác định phần mở rộng file từ tên gốc
      let fileExt = ''
      if (file.originalname) {
        const parts = file.originalname.split('.')
        if (parts.length > 1) fileExt = parts.pop() || ''
      }

      // Nếu không có phần mở rộng, thử xác định từ MIME type
      if (!fileExt) {
        if (file.mimetype.includes('pdf')) fileExt = 'pdf'
        else if (file.mimetype.includes('word')) fileExt = 'docx'
        else if (file.mimetype.includes('excel')) fileExt = 'xlsx'
        else if (file.mimetype.includes('powerpoint')) fileExt = 'pptx'
      }

      // Tạo URL tải xuống với tham số đúng
      downloadUrl = `${result.secure_url.split('?')[0]}?fl_attachment=true&dn=${encodeURIComponent(file.originalname || `document.${fileExt || 'pdf'}`)}`

      console.log(`Đã tạo URL tải xuống cho document: ${downloadUrl}`)
    } else {
      fileType = 'FILE'

      // Xác định phần mở rộng file từ tên gốc
      let fileExt = ''
      if (file.originalname) {
        const parts = file.originalname.split('.')
        if (parts.length > 1) fileExt = parts.pop() || ''
      }

      // Tạo URL tải xuống với tham số đúng
      downloadUrl = `${result.secure_url.split('?')[0]}?fl_attachment=true&dn=${encodeURIComponent(file.originalname || `file.${fileExt || 'dat'}`)}`

      console.log(`Đã tạo URL tải xuống cho file: ${downloadUrl}`)
    }

    // Không trả về trường downloadUrl trong response để tránh lỗi ở client
    return {
      url: result.secure_url,
      // downloadUrl được thêm vào đây dưới dạng mô tả, nhưng sẽ được client bỏ khi gửi lên server
      downloadUrl: downloadUrl,
      fileName: file.originalname,
      fileSize: result.bytes,
      fileType: file.mimetype,
      thumbnailUrl: thumbnailUrl || undefined,
      type: fileType,
    }
  }

  /**
   * Upload nhiều file cùng một lúc
   */
  @Post('documents')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadDocuments(@Req() req, @Res() res, @Next() next) {
    try {
      const files = req.files as Express.Multer.File[]
      // Định nghĩa kiểu cho mảng uploadedFiles
      interface UploadedFileInfo {
        fileUrl: string
        downloadUrl: string
        fileName: string
        fileType: string
        fileSize: number
      }
      const uploadedFiles: UploadedFileInfo[] = []

      for (const file of files) {
        const result = await this.cloudinaryService.uploadMessageFile(file)
        const fileType = file.mimetype
        const fileName = file.originalname
        const fileSize = file.size

        // Xác định phần mở rộng file
        const fileExtension = fileName.includes('.')
          ? fileName.split('.').pop()
          : ''

        // Tạo URL tải xuống với tham số đúng
        // Đảm bảo URL cơ bản không có tham số query trước đó
        const baseUrl = result.secure_url.split('?')[0]
        const downloadUrl = `${baseUrl}?fl_attachment=true&dn=${encodeURIComponent(fileName)}`

        uploadedFiles.push({
          fileUrl: result.secure_url,
          downloadUrl,
          fileName,
          fileType,
          fileSize,
        })
      }

      return res.status(200).json({
        success: true,
        data: uploadedFiles,
      })
    } catch (error) {
      next(error)
    }
  }
}
