import { Body, Controller, Get, Put } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { ProfileService } from './profile.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { UpdateMeBodyDTO } from 'src/routes/profile/profile.dto'
import {
  GetUserProfileResDTO,
  UpdateProfileResDTO,
} from 'src/shared/dtos/shared-user.dto'

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ZodSerializerDto(GetUserProfileResDTO)
  getProfile(@ActiveUser('userId') userId: number) {
    return this.profileService.getProfile(userId)
  }

  @Put()
  @ZodSerializerDto(UpdateProfileResDTO)
  updateProfile(
    @Body() body: UpdateMeBodyDTO,
    @ActiveUser('userId') userId: number
  ) {
    return this.profileService.updateProfile({
      userId,
      body,
    })
  }
}
