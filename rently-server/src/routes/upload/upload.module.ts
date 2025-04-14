import { Module } from '@nestjs/common'
import { UploadService } from 'src/routes/upload/cloudinary.service'
import { UploadController } from 'src/routes/upload/upload.controller'

@Module({
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
