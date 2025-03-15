import { createZodDto } from 'nestjs-zod'
import {
  GetMeSchema,
  GetUserSchema,
  GetUsersQuerySchema,
  GetUsersResSchema,
  UpdateUserSchema,
} from 'src/routes/users/users.model'

export class GetMeResDTO extends createZodDto(GetMeSchema) {}

export class GetUsersQueryDTO extends createZodDto(GetUsersQuerySchema) {}

export class GetUsersResDTO extends createZodDto(GetUsersResSchema) {}

export class GetUserResDTO extends createZodDto(GetUserSchema) {}

export class UpdateUserDTO extends createZodDto(UpdateUserSchema) {}
