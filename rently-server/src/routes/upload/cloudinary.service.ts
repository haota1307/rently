import { Injectable, InternalServerErrorException } from '@nestjs/common'
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary'
import * as streamifier from 'streamifier'

// Khởi tạo Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

@Injectable()
export class UploadService {
  constructor() {}

  /**
   * Upload hình ảnh lên Cloudinary
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'uploads'
  ): Promise<UploadApiResponse> {
    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            transformation: [{ quality: 'auto:best', fetch_format: 'auto' }],
          },
          (error: UploadApiErrorResponse, result: UploadApiResponse) => {
            if (error) {
              return reject(error)
            }
            resolve(result)
          }
        )
        streamifier.createReadStream(file.buffer).pipe(uploadStream)
      })
      return result
    } catch (error) {
      throw new InternalServerErrorException((error as Error).message)
    }
  }

  /**
   * Upload video lên Cloudinary
   */
  async uploadVideo(
    file: Express.Multer.File,
    folder: string = 'videos'
  ): Promise<UploadApiResponse> {
    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'video',
            transformation: [
              {
                quality: 'auto:low',
                video_codec: 'h264',
                fetch_format: 'mp4',
              },
            ],
          },
          (error: UploadApiErrorResponse, result: UploadApiResponse) => {
            if (error) {
              return reject(error)
            }
            resolve(result)
          }
        )
        streamifier.createReadStream(file.buffer).pipe(uploadStream)
      })
      return result
    } catch (error) {
      throw new InternalServerErrorException((error as Error).message)
    }
  }

  /**
   * Upload file cho tin nhắn
   */
  async uploadMessageFile(
    file: Express.Multer.File,
    folder: string = 'messages'
  ): Promise<UploadApiResponse> {
    try {
      // Xác định loại file dựa trên MIME type
      const resourceType = this.getResourceType(file.mimetype)
      const isDocument =
        file.mimetype === 'application/pdf' ||
        file.mimetype.includes('word') ||
        file.mimetype.includes('excel') ||
        file.mimetype.includes('powerpoint') ||
        file.mimetype.includes('openxmlformats')

      // Lấy phần mở rộng file từ tên file gốc
      let fileExtension = ''
      if (file.originalname) {
        const parts = file.originalname.split('.')
        if (parts.length > 1) {
          fileExtension = parts.pop() || ''
        }
      }

      // Nếu không có phần mở rộng, thử xác định từ MIME type
      if (!fileExtension) {
        if (file.mimetype.includes('pdf')) fileExtension = 'pdf'
        else if (file.mimetype.includes('word')) fileExtension = 'docx'
        else if (file.mimetype.includes('excel')) fileExtension = 'xlsx'
        else if (file.mimetype.includes('powerpoint')) fileExtension = 'pptx'
      }

      console.log(
        `Uploading file: ${file.originalname}, MIME: ${file.mimetype}, Type: ${resourceType}, Extension: ${fileExtension}`
      )

      // Upload file lên Cloudinary
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadOptions = {
          folder,
          resource_type: resourceType as 'image' | 'video' | 'raw',
          // Thêm tùy chọn cho file document để đảm bảo tên file gốc được giữ nguyên
          ...(isDocument && {
            use_filename: true,
            unique_filename: true,
            // Thêm format để đảm bảo định dạng file được giữ nguyên
            format: fileExtension || 'raw',
            type: 'upload',
            // Thay thế access_mode: 'authenticated' bằng public
            access_mode: 'public',
            // Thêm các tùy chọn để tránh xử lý file
            raw_transformation: 'fl_attachment',
          }),
          // Nếu là hình ảnh, áp dụng transformation
          ...(resourceType === 'image' && {
            transformation: [{ quality: 'auto:best', fetch_format: 'auto' }],
          }),
          // Nếu là video, áp dụng transformation riêng
          ...(resourceType === 'video' && {
            transformation: [
              {
                quality: 'auto:low',
                video_codec: 'h264',
                fetch_format: 'mp4',
              },
            ],
          }),
        }

        console.log('Upload options:', uploadOptions)

        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error: UploadApiErrorResponse, result: UploadApiResponse) => {
            if (error) {
              console.error('Cloudinary upload error:', error)
              return reject(error)
            }
            console.log('Cloudinary upload success:', {
              public_id: result.public_id,
              format: result.format,
              url: result.url,
              secure_url: result.secure_url,
            })
            resolve(result)
          }
        )

        streamifier.createReadStream(file.buffer).pipe(uploadStream)
      })

      return result
    } catch (error) {
      console.error('Error in uploadMessageFile:', error)
      throw new InternalServerErrorException((error as Error).message)
    }
  }

  /**
   * Xác định loại resource cho Cloudinary dựa trên MIME type
   * @returns 'image', 'video', hoặc 'raw'
   */
  private getResourceType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'image'
    } else if (mimeType.startsWith('video/')) {
      return 'video'
    } else if (mimeType.includes('audio')) {
      return 'video' // Cloudinary xử lý audio dưới dạng video
    } else {
      return 'raw' // Tất cả các loại file khác
    }
  }
}
