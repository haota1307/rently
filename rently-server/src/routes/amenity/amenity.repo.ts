import { Injectable, InternalServerErrorException } from '@nestjs/common'
import {
  CreateAmenityBodyType,
  GetAmenitiesQueryType,
  UpdateAmenityBodyType,
} from 'src/routes/amenity/amenity.schema'

import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class AmenityRepo {
  constructor(private prismaService: PrismaService) {}

  async list(query: GetAmenitiesQueryType) {
    try {
      const skip = (query.page - 1) * query.limit
      const take = query.limit
      const where: any = {}

      if (query.name) {
        where.name = { contains: query.name, mode: 'insensitive' }
      }

      const [totalItems, data] = await Promise.all([
        this.prismaService.amenity.count({ where }),
        this.prismaService.amenity.findMany({
          where,
          skip,
          take,
          orderBy: {
            name: 'asc',
          },
        }),
      ])

      return {
        data,
        totalItems,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(totalItems / query.limit),
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async findById(id: number) {
    try {
      return await this.prismaService.amenity.findUnique({
        where: { id },
      })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async create({ data }: { data: CreateAmenityBodyType }) {
    try {
      return await this.prismaService.amenity.create({
        data: {
          name: data.name,
        },
      })
    } catch (error) {
      if (error.code === 'P2002') {
        throw new InternalServerErrorException('Amenity name already exists')
      }
      throw new InternalServerErrorException(error.message)
    }
  }

  async update({ id, data }: { id: number; data: UpdateAmenityBodyType }) {
    try {
      return await this.prismaService.amenity.update({
        where: { id },
        data: {
          name: data.name,
        },
      })
    } catch (error) {
      if (error.code === 'P2002') {
        throw new InternalServerErrorException('Amenity name already exists')
      }
      throw new InternalServerErrorException(error.message)
    }
  }

  async delete({ id }: { id: number }) {
    try {
      return await this.prismaService.amenity.delete({
        where: { id },
      })
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
