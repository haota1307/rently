import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bull'
import {
  CANCEL_PAYMENT_JOB_NAME,
  CANCEL_WITHDRAW_JOB_NAME,
  PAYMENT_QUEUE_NAME,
} from 'src/shared/constants/queue.constant'
import {
  generateCancelPaymentJobId,
  generateCancelWithdrawJobId,
} from 'src/shared/helpers'

@Injectable()
export class PaymentProducer {
  constructor(@InjectQueue('payment') private paymentQueue: Queue) {}

  async addCheckExpiredPaymentJob() {
    const job = await this.paymentQueue.add(
      'check-expired-payment',
      {},
      {
        repeat: { cron: '0 */5 * * * *' }, // Chạy mỗi 5 phút
        removeOnComplete: 10,
        removeOnFail: 5,
      }
    )

    const jobs = await this.paymentQueue.getJobs([
      'waiting',
      'active',
      'completed',
    ])

    return { jobId: job.id, totalJobs: jobs.length }
  }

  async addCancelPaymentJob(
    paymentId: number,
    delayTime: number = 30 * 60 * 1000
  ) {
    const job = await this.paymentQueue.add(
      'cancel-payment',
      { paymentId },
      {
        delay: delayTime,
        removeOnComplete: 5,
        removeOnFail: 3,
      }
    )

    const counts = await this.paymentQueue.getJobCounts()

    return { jobId: job.id, queueStats: counts }
  }

  async addCancelWithdrawJob(
    withdrawId: number,
    delayTime: number = 5 * 60 * 1000
  ) {
    const job = await this.paymentQueue.add(
      'cancel-withdraw',
      { withdrawId },
      {
        delay: delayTime,
        removeOnComplete: 5,
        removeOnFail: 3,
      }
    )

    const counts = await this.paymentQueue.getJobCounts()

    return { jobId: job.id, queueStats: counts }
  }

  async cancelPaymentJob(paymentId: number) {
    await this.paymentQueue.add(
      CANCEL_PAYMENT_JOB_NAME,
      { paymentId },
      {
        delay: 1000 * 60 * 15, // 15 minutes
        jobId: generateCancelPaymentJobId(paymentId),
        removeOnComplete: true,
        removeOnFail: true,
      }
    )
  }

  async removeCancelPaymentJob(paymentId: number) {
    return await this.paymentQueue.remove(generateCancelPaymentJobId(paymentId))
  }

  async cancelWithdrawJob(withdrawId: number) {
    await this.paymentQueue.add(
      CANCEL_WITHDRAW_JOB_NAME,
      { withdrawId },
      {
        delay: 1000 * 60 * 15, // 15 minutes
        jobId: generateCancelWithdrawJobId(withdrawId),
        removeOnComplete: true,
        removeOnFail: true,
      }
    )
  }

  async removeCancelWithdrawJob(withdrawId: number) {
    return await this.paymentQueue.remove(
      generateCancelWithdrawJobId(withdrawId)
    )
  }
}
