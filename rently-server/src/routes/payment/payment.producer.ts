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
}
