import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
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
}
