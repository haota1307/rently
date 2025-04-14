export interface UploadedFile {
  url: string
  publicId: string
  originalName: string
  size: number
  mimetype: string
  thumbnailUrl?: string
}

export interface UploadResponse {
  success: boolean
  message?: string
  file?: UploadedFile
  files?: UploadedFile[]
  error?: string
}
