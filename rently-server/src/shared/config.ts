import { config } from 'dotenv'
import { z } from 'zod'

// Chỉ load .env khi chạy local (không phải production)
if (process.env.NODE_ENV !== 'production') {
  config() // Tự động đọc từ file .env
}

const configSchema = z.object({
  DATABASE_URL: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  PORT: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string(),
  ADMIN_NAME: z.string(),
  ADMIN_PASSWORD: z.string(),
  ADMIN_EMAIL: z.string(),
  ADMIN_PHONE_NUMBER: z.string(),
  OTP_EXPIRES_IN: z.string(),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string(),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  EMAIL_FROM: z.string().default('Rently <no-reply@rently.top>'),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),
  GOOGLE_CLIENT_REDIRECT_URI: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  OPENAI_API_KEY: z.string(),
  PAYMENT_API_KEY: z.string(),
  REDIS_URL: z.string(),
  BANK_ACCOUNT: z.string(),
  BANK_NAME: z.string(),
  BANK_ACCOUNT_NAME: z.string(),
  SEPAY_API_KEY: z.string(),
  SEPAY_API_URL: z.string(),
  SEPAY_BANK_ACCOUNT_ID: z.string(),
})

const configServer = configSchema.safeParse(process.env)

if (!configServer.success) {
  console.error('❌ Các giá trị biến môi trường không hợp lệ:')
  console.error(configServer.error.format())
  process.exit(1)
}

const envConfig = configServer.data

export default envConfig
