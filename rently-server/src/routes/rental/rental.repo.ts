import { Injectable, InternalServerErrorException } from '@nestjs/common'
import {
  CreateRentalBodyType,
  GetRentalsQueryType,
  GetRentalsResType,
  RentalType,
  UpdateRentalBodyType,
} from 'src/routes/rental/rental.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Decimal } from '@prisma/client/runtime/library'
import { calculateDistance, toNumber } from 'src/shared/helpers'

@Injectable()
export class RentalRepo {
  constructor(private prismaService: PrismaService) {}

  private formatRental = (rental: any): RentalType => {
    const defaultLat = 10.0070868
    const defaultLng = 105.7226855

    const formattedRental: RentalType = {
      ...rental,
      lat: toNumber(rental.lat),
      lng: toNumber(rental.lng),
    }

    formattedRental.distance = calculateDistance(
      defaultLat,
      defaultLng,
      formattedRental.lat,
      formattedRental.lng
    )

    return formattedRental
  }

  async list(query: GetRentalsQueryType): Promise<GetRentalsResType> {
    try {
      const skip = (query.page - 1) * query.limit
      const take = query.limit

      const [totalItems, data] = await Promise.all([
        this.prismaService.rental.count(),
        this.prismaService.rental.findMany({
          skip,
          take,
          include: {
            landlord: true,
            rentalImages: true,
          },
        }),
      ])

      return {
        data: data.map(rental => this.formatRental(rental)),
        totalItems,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(totalItems / query.limit),
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async findById(id: number): Promise<RentalType | null> {
    try {
      const rental = await this.prismaService.rental.findUnique({
        where: { id },
        include: {
          landlord: true,
          rentalImages: true,
          rooms: true,
        },
      })
      return rental ? this.formatRental(rental) : null
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async create({ data }: { data: CreateRentalBodyType }) {
    try {
      const rental = await this.prismaService.rental.create({
        data: {
          title: data.title,
          description: data.description,
          address: data.address,
          lat: data.lat,
          lng: data.lng,
          landlordId: data.landlordId,
        },
        include: {
          landlord: true,
          rentalImages: true,
          rooms: true,
        },
      })

      if (data.rentalImages && data.rentalImages.length > 0) {
        await this.prismaService.rentalImage.createMany({
          data: data.rentalImages.map(image => ({
            rentalId: rental.id,
            order: image.order || 0,
            imageUrl: image.imageUrl,
          })),
        })
      }

      return this.formatRental(rental)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async update({
    id,
    data,
  }: {
    id: number
    data: UpdateRentalBodyType
  }): Promise<RentalType> {
    try {
      const { rentalImages, ...rentalData } = data

      const rental = await this.prismaService.rental.update({
        where: { id },
        data: rentalData,
        include: {
          landlord: true,
          rentalImages: true,
          rooms: true,
        },
      })

      if (rentalImages) {
        await this.prismaService.rentalImage.deleteMany({
          where: { rentalId: id },
        })

        await this.prismaService.rentalImage.createMany({
          data: rentalImages.map(image => ({
            imageUrl: image.imageUrl,
            order: image.order || 0,
            rentalId: id,
          })),
        })
      }

      const updatedRental = await this.prismaService.rental.findUnique({
        where: { id },
        include: {
          landlord: true,
          rentalImages: true,
          rooms: true,
        },
      })

      return this.formatRental(updatedRental)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async delete({ id }: { id: number }): Promise<RentalType> {
    try {
      const rental = await this.prismaService.rental.delete({
        where: { id },
        include: {
          landlord: true,
          rentalImages: true,
        },
      })
      return this.formatRental(rental)
    } catch (error) {
      throw new InternalServerErrorException(error.message)
    }
  }
}
