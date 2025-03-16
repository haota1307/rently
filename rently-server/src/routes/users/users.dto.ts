import { createZodDto } from 'nestjs-zod'
import {
  GetMeResSchema,
  GetUserResSchema,
  GetUsersQuerySchema,
  GetUsersResSchema,
  UpdateUserBodySchema,
  UpdateUserResSchema,
} from 'src/routes/users/users.model'

export class GetMeResDTO extends createZodDto(GetMeResSchema) {}

export class GetUsersQueryDTO extends createZodDto(GetUsersQuerySchema) {}

export class GetUsersResDTO extends createZodDto(GetUsersResSchema) {}

export class GetUserResDTO extends createZodDto(GetUserResSchema) {}

export class UpdateUserDTO extends createZodDto(UpdateUserBodySchema) {}
