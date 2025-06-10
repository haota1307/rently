import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bullmq'
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
  constructor(
    @InjectQueue(PAYMENT_QUEUE_NAME) private readonly paymentQueue: Queue
  ) {
    this.paymentQueue.getJobs().then(jobs => {
      console.log(jobs)
    })
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

    this.paymentQueue.getJobCounts().then(counts => {
      console.log('Cancel payment job added', counts)
    })
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

    this.paymentQueue.getJobCounts().then(counts => {
      console.log('Cancel withdraw job added', counts)
    })
  }

  async removeCancelWithdrawJob(withdrawId: number) {
    return await this.paymentQueue.remove(
      generateCancelWithdrawJobId(withdrawId)
    )
  }
}
