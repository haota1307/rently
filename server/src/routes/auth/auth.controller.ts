import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from 'src/routes/auth/auth.service';
import { RegisterBodyDTO, RegisterResDTO } from 'src/routes/auth/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterBodyDTO) {
    return new RegisterResDTO(await this.authService.register(body));
  }
}
