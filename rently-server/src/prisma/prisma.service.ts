import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    })

    // Add debug logs for notification queries
    this.$on('query' as any, (e: any) => {
      if (
        (e.query && e.query.includes('notification')) ||
        e.query.includes('Notification')
      ) {
        console.log('Prisma Query:', e.query)
        console.log('Prisma Params:', e.params)
        console.log('Prisma Duration:', `${e.duration}ms`)
      }
    })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
