import cloudinary from '../configs/cloudinary'
import { UploadedFile } from '../types/upload'
import streamifier from 'streamifier'

/**
 * Upload đơn file lên Cloudinary
 * @param file File buffer cần upload
 * @param folder Thư mục lưu trữ (optional)
 * @returns Thông tin file đã upload
 */
export const uploadSingleFile = async (
  file: Express.Multer.File,
  folder = 'messages'
): Promise<UploadedFile> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          return reject(error)
        }

        const uploadedFile: UploadedFile = {
          url: result?.secure_url || '',
          publicId: result?.public_id || '',
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        }

        // Nếu là file ảnh, thêm thumbnail URL
        if (file.mimetype.startsWith('image/')) {
          uploadedFile.thumbnailUrl = result?.secure_url || ''
        }

        return resolve(uploadedFile)
      }
    )

    streamifier.createReadStream(file.buffer).pipe(uploadStream)
  })
}

/**
 * Upload nhiều file lên Cloudinary
 * @param files Mảng các file buffer cần upload
 * @param folder Thư mục lưu trữ (optional)
 * @returns Mảng thông tin các file đã upload
 */
export const uploadMultipleFiles = async (
  files: Express.Multer.File[],
  folder = 'messages'
): Promise<UploadedFile[]> => {
  const uploadPromises = files.map(file => uploadSingleFile(file, folder))
  return Promise.all(uploadPromises)
}

/**
 * Xóa file từ Cloudinary theo public ID
 * @param publicId Public ID của file cần xóa
 * @returns Kết quả xóa file
 */
export const deleteFile = async (publicId: string): Promise<any> => {
  return cloudinary.uploader.destroy(publicId)
}
