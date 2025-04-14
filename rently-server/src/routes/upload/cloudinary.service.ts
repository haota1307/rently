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
            transformation: [
              { quality: 'auto', fetch_format: 'auto' },
              { width: 'auto', crop: 'scale' },
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

      // Upload file lên Cloudinary
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: resourceType as 'image' | 'video' | 'raw',
            // Nếu là hình ảnh, áp dụng transformation
            ...(resourceType === 'image' && {
              transformation: [{ quality: 'auto', fetch_format: 'auto' }],
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
   * Xác định loại resource cho Cloudinary dựa trên MIME type
   * @returns 'image', 'video', hoặc 'raw'
   */
  private getResourceType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'image'
    } else if (mimeType.startsWith('video/')) {
      return 'video'
    } else if (mimeType.startsWith('audio/')) {
      return 'video' // Cloudinary xử lý audio dưới dạng video
    } else {
      return 'raw' // Tất cả các loại file khác
    }
  }
}
