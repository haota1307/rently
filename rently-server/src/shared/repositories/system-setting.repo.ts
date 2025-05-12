import { Injectable } from '@nestjs/common'
import { SystemSetting } from '@prisma/client'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class SystemSettingRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(): Promise<SystemSetting[]> {
    return this.prismaService.systemSetting.findMany({
      orderBy: {
        key: 'asc',
      },
    })
  }

  async findByKey(key: string): Promise<SystemSetting | null> {
    return this.prismaService.systemSetting.findUnique({
      where: {
        key,
      },
    })
  }

  async findByGroup(group: string): Promise<SystemSetting[]> {
    return this.prismaService.systemSetting.findMany({
      where: {
        group,
      },
      orderBy: {
        key: 'asc',
      },
    })
  }

  async create(data: {
    key: string
    value: string
    type: string
    group: string
    description?: string
    createdById?: number
  }): Promise<SystemSetting> {
    return this.prismaService.systemSetting.create({
      data,
    })
  }

  async update(
    key: string,
    data: {
      value?: string
      type?: string
      group?: string
      description?: string
      updatedById?: number
    }
  ): Promise<SystemSetting> {
    return this.prismaService.systemSetting.update({
      where: {
        key,
      },
      data,
    })
  }

  async delete(key: string): Promise<SystemSetting> {
    return this.prismaService.systemSetting.delete({
      where: {
        key,
      },
    })
  }
}
