import { Injectable, InternalServerErrorException } from '@nestjs/common'
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary'
import * as streamifier from 'streamifier'
import { Express } from 'express'

@Injectable()
export class UploadService {
  constructor() {
    // Cấu hình Cloudinary từ biến môi trường
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'uploads'
  ): Promise<UploadApiResponse> {
    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
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

  async uploadVideo(
    file: Express.Multer.File,
    folder: string = 'uploads/videos'
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
}
