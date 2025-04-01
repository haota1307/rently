import { Module } from '@nestjs/common'
import { AmenityController } from 'src/routes/amenity/amenity.controller'

import { AmenityRepo } from 'src/routes/amenity/amenity.repo'
import { AmenityService } from 'src/routes/amenity/amenity.service'

@Module({
  controllers: [AmenityController],
  providers: [AmenityService, AmenityRepo],
})
export class AmenityModule {}
