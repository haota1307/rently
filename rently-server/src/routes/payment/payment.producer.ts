import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bullmq'
import {
  CANCEL_PAYMENT_JOB_NAME,
  PAYMENT_QUEUE_NAME,
} from 'src/shared/constants/queue.constant'
import { generateCancelPaymentJobId } from 'src/shared/helpers'

@Injectable()
export class PaymentProducer {
  constructor(
    @InjectQueue(PAYMENT_QUEUE_NAME) private readonly paymentQueue: Queue
  ) {
    // this.paymentQueue.getJobs().then(jobs => {
    //   console.log(jobs)
    // })
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

  removeCancelPaymentJob(paymentId: number) {
    return this.paymentQueue.remove(generateCancelPaymentJobId(paymentId))
  }

  async addCancelPaymentJob(paymentId: number, delay: number = 0) {
    return this.paymentQueue.add(
      'cancel-payment',
      { paymentId },
      {
        delay,
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      }
    )
  }
}
