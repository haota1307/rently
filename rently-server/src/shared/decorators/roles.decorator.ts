import { SetMetadata } from '@nestjs/common'
import { RoleName } from '../constants/role.constant'

export const ROLES_KEY = 'roles'
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)
