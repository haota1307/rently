import { Injectable, UnauthorizedException } from '@nestjs/common'
import { auth, OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import { GoogleAuthStateType } from 'src/routes/auth/auth.model'
import { AuthRepository } from 'src/routes/auth/auth.repo'
import { AuthService } from 'src/routes/auth/auth.service'
import {
  GoogleUserInfoError,
  UserBlockedException,
} from 'src/routes/auth/auth.error'

import envConfig from 'src/shared/config'
import { HashingService } from 'src/shared/services/hashing.service'
import { v4 as uuidv4 } from 'uuid'
import { SharedRoleRepository } from 'src/shared/repositories/shared-role.repo'
import { UserStatus } from 'src/shared/constants/auth.constant'

@Injectable()
export class GoogleService {
  private oauth2Client: OAuth2Client

  constructor(
    private readonly authRepo: AuthRepository,
    private readonly authService: AuthService,
    private readonly hashingService: HashingService,
    private readonly sharedRolesService: SharedRoleRepository
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      envConfig.GOOGLE_CLIENT_ID,
      envConfig.GOOGLE_CLIENT_SECRET,
      envConfig.GOOGLE_REDIRECT_URI
    )
  }

  getAuthorizationUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ]

    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
    })

    return { url }
  }

  async googleCallback({ code, state }: { code: string; state: string }) {
    try {
      // `. Dùng code để lấy token
      const { tokens } = await this.oauth2Client.getToken(code)
      this.oauth2Client.setCredentials(tokens)

      // 2. Lấy thông tin user
      const oauth2 = google.oauth2({
        auth: this.oauth2Client,
        version: 'v2',
      })
      const { data } = await oauth2.userinfo.get()

      if (!data.email) {
        throw GoogleUserInfoError
      }

      let user = await this.authRepo.findUniqueUserIncludeRole({
        email: data.email,
      })

      // 3. Nếu user chưa tồn tại thì tạo mới
      if (!user) {
        const clientRoleId = await this.sharedRolesService.getClientRoleId()
        const randomPassword = uuidv4()
        const hashedPassword = await this.hashingService.hash(randomPassword)

        user = await this.authRepo.createUserIncludeRole({
          email: data.email,
          name: data.name ?? '',
          password: hashedPassword,
          roleId: clientRoleId,
          phoneNumber: '',
          avatar: data.picture ?? '',
          status: UserStatus.ACTIVE,
        })
      } else {
        // Kiểm tra nếu tài khoản đã bị khóa
        if (user.status === UserStatus.BLOCKED) {
          console.log('[DEBUG] User is blocked:', user.email)
          const blockedError = new Error('Error.UserBlocked')
          throw blockedError
        }
      }

      // 4. Tạo token cho user (dù mới tạo hay đã tồn tại)
      const authTokens = await this.authService.generateTokens({
        userId: user.id,
        roleId: user.roleId,
        roleName: user.role.name,
      })

      return authTokens
    } catch (error) {
      console.error('Error in Google callback', error)
      throw error
    }
  }
}
