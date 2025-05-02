import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Logger } from '@nestjs/common'
import {
  CANCEL_PAYMENT_JOB_NAME,
  CANCEL_WITHDRAW_JOB_NAME,
  PAYMENT_QUEUE_NAME,
} from 'src/shared/constants/queue.constant'
import { SharedPaymentRepository } from 'src/shared/repositories/shared-payment.repo'

@Processor(PAYMENT_QUEUE_NAME)
export class PaymentConsumer extends WorkerHost {
  private readonly logger = new Logger(PaymentConsumer.name)

  constructor(private readonly sharedPaymentRepo: SharedPaymentRepository) {
    super()
    this.logger.log('PaymentConsumer initialized')
  }

  async process(
    job: Job<{ paymentId?: number; withdrawId?: number }, any, string>
  ): Promise<any> {
    this.logger.log(`Processing job ${job.name} with id ${job.id}`)

    try {
      switch (job.name) {
        case CANCEL_PAYMENT_JOB_NAME: {
          const { paymentId } = job.data
          if (!paymentId) {
            this.logger.error('Missing paymentId in job data')
            throw new Error('Missing paymentId in job data')
          }
          this.logger.log(`Cancelling payment ${paymentId}`)

          await this.sharedPaymentRepo.cancelPayment(paymentId)
          this.logger.log(`Payment ${paymentId} cancelled successfully`)

          return { success: true }
        }
        case CANCEL_WITHDRAW_JOB_NAME: {
          const { withdrawId } = job.data
          if (!withdrawId) {
            this.logger.error('Missing withdrawId in job data')
            throw new Error('Missing withdrawId in job data')
          }
          this.logger.log(`Cancelling withdraw request ${withdrawId}`)

          await this.sharedPaymentRepo.cancelWithdraw(withdrawId)
          this.logger.log(
            `Withdraw request ${withdrawId} cancelled successfully`
          )

          return { success: true }
        }
        default: {
          this.logger.warn(`No handler for job type: ${job.name}`)
          break
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing job ${job.id}: ${error.message}`,
        error.stack
      )
      throw error
    }
  }
}
