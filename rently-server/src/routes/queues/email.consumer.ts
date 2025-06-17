import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { EmailService } from 'src/shared/services/email.service'

interface BulkEmailJobData {
  users: Array<{
    id: number
    name: string
    email: string
  }>
  subject: string
  message: string
  adminName: string
  adminEmail: string
}

@Processor('email')
@Injectable()
export class EmailConsumer extends WorkerHost {
  private readonly logger = new Logger(EmailConsumer.name)

  constructor(private readonly emailService: EmailService) {
    super()
  }

  async process(job: Job<BulkEmailJobData>): Promise<any> {
    const { users, subject, message, adminName, adminEmail } = job.data

    this.logger.log(
      `Processing bulk email job ${job.id} for ${users.length} users`
    )

    let successCount = 0
    let failureCount = 0
    const errors: string[] = []

    for (let i = 0; i < users.length; i++) {
      const user = users[i]

      try {
        await this.emailService.sendAdminDirectEmail({
          to: user.email,
          userName: user.name,
          subject,
          message,
          adminName,
          adminEmail,
        })

        successCount++
        this.logger.log(`Email sent successfully to ${user.email}`)

        // Update progress
        const progress = Math.round(((i + 1) / users.length) * 100)
        await job.updateProgress(progress)

        // Delay để tránh rate limit
        if (i < users.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay between emails
        }
      } catch (error) {
        failureCount++
        const errorMessage = `Failed to send email to ${user.email}: ${error.message}`
        errors.push(errorMessage)
        this.logger.error(errorMessage)
      }
    }

    const result = {
      totalUsers: users.length,
      successCount,
      failureCount,
      errors: errors.slice(0, 10), // Chỉ lưu 10 lỗi đầu tiên để tránh quá tải
    }

    this.logger.log(
      `Bulk email job ${job.id} completed: ${successCount} success, ${failureCount} failures`
    )

    return result
  }
}
