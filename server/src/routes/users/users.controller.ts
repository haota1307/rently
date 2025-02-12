import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import {
  GetMyProfileResDTO,
  GetProfileByIdResDTO,
  UpdateUserProfileBodyDTO,
  UpdateUserProfileResDTO,
} from 'src/routes/users/user.dto';
import { UsersService } from 'src/routes/users/users.service';
import { AuthType, ConditionGuard } from 'src/shared/constants/auth.constant';
import { ActiveUser } from 'src/shared/decorators/active-user.decorator';
import { Auth } from 'src/shared/decorators/auth.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @Auth([AuthType.Bearer], { condition: ConditionGuard.And })
  async getMyProfile(@ActiveUser('userId') userId: number) {
    return new GetMyProfileResDTO(
      await this.usersService.getProfileById(userId),
    );
  }

  @Get(':userId')
  async getProfileById(@Param('userId') userId: number) {
    return new GetProfileByIdResDTO(
      await this.usersService.getProfileById(Number(userId)),
    );
  }

  @Put(':userId')
  @Auth([AuthType.Bearer], { condition: ConditionGuard.And })
  async updateUserProfile(
    @Param('userId') userId: number,
    @ActiveUser('userId') currentUserId: number,
    @Body() body: UpdateUserProfileBodyDTO,
  ) {
    if (currentUserId !== userId) {
      throw new UnauthorizedException(
        'Không được phép sửa thông tin người khác',
      );
    }

    return new UpdateUserProfileResDTO(
      await this.usersService.updateUserProfile(userId, body),
    );
  }
}
