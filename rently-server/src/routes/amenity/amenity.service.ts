import { Injectable } from '@nestjs/common'

import { NotFoundRecordException } from 'src/shared/error'
import {
  CreateAmenityBodyType,
  GetAmenitiesQueryType,
  UpdateAmenityBodyType,
} from 'src/routes/amenity/amenity.dto'
import { AmenityRepo } from 'src/routes/amenity/amenity.repo'

@Injectable()
export class AmenityService {
  constructor(private readonly amenityRepo: AmenityRepo) {}

  async list(query: GetAmenitiesQueryType) {
    return this.amenityRepo.list(query)
  }

  async findById(id: number) {
    const amenity = await this.amenityRepo.findById(id)
    if (!amenity) {
      throw NotFoundRecordException
    }
    return amenity
  }

  async create({ data }: { data: CreateAmenityBodyType }) {
    return this.amenityRepo.create({ data })
  }

  async update({ id, data }: { id: number; data: UpdateAmenityBodyType }) {
    try {
      return await this.amenityRepo.update({ id, data })
    } catch (error) {
      throw NotFoundRecordException
    }
  }

  async delete({ id }: { id: number }) {
    try {
      await this.amenityRepo.delete({ id })
      return { message: 'Delete successfully' }
    } catch (error) {
      throw NotFoundRecordException
    }
  }
}
