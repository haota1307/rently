import { z } from "zod";

// Enum cho trạng thái yêu cầu thuê
export enum RentalRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELED = "CANCELED",
}

// Schema cho thông tin room trong RentalRequest
export const RentalRequestRoomSchema = z.object({
  id: z.number(),
  title: z.string(),
  area: z.number().nullable(),
  price: z.number().nullable(),
});

// Schema cho thông tin rental trong RentalRequest
export const RentalRequestRentalSchema = z.object({
  id: z.number(),
  title: z.string(),
  address: z.string().nullable(),
});

// Schema cho thông tin post trong RentalRequest
export const RentalRequestPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  buildingName: z.string(),
  address: z.string(),
  roomNumber: z.string(),
  price: z.number(),
  area: z.number(),
  isAvailable: z.boolean(),
  images: z.array(z.string()),
  createdAt: z.string().datetime().optional(),
  description: z.string().nullable(),
  room: RentalRequestRoomSchema.nullable(),
  rental: RentalRequestRentalSchema.nullable(),
});

// Schema cho thông tin người dùng trong RentalRequest
export const RentalRequestUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  phoneNumber: z.string().nullable(),
  email: z.string(),
});

// Schema cho chi tiết RentalRequest
export const RentalRequestSchema = z.object({
  id: z.number(),
  postId: z.number(),
  tenantId: z.number(),
  landlordId: z.number(),
  status: z.nativeEnum(RentalRequestStatus),
  note: z.string().nullable(),
  expectedMoveDate: z.string().or(z.date()),
  duration: z.number(),
  depositAmount: z.number().nullable(),
  contractSigned: z.boolean(),
  rejectionReason: z.string().nullable(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  post: RentalRequestPostSchema,
  tenant: RentalRequestUserSchema,
  landlord: RentalRequestUserSchema,
});

// Schema cho tạo yêu cầu thuê mới
export const CreateRentalRequestBodySchema = z.object({
  postId: z.number(),
  expectedMoveDate: z.string(),
  duration: z.number(),
  note: z.string().optional(),
});

// Schema cho cập nhật yêu cầu thuê
export const UpdateRentalRequestBodySchema = z.object({
  status: z.nativeEnum(RentalRequestStatus).optional(),
  rejectionReason: z.string().optional(),
  contractSigned: z.boolean().optional(),
  depositAmount: z.number().optional(),
  note: z.string().optional(),
});

// Schema cho query lấy danh sách yêu cầu thuê
export const GetRentalRequestsQuerySchema = z.object({
  limit: z.number().default(10),
  page: z.number().default(1),
  status: z.nativeEnum(RentalRequestStatus).optional(),
  role: z.enum(["TENANT", "LANDLORD"]).optional(),
});

// Types
export type RentalRequestType = z.infer<typeof RentalRequestSchema>;
export type CreateRentalRequestBodyType = z.infer<
  typeof CreateRentalRequestBodySchema
>;
export type UpdateRentalRequestBodyType = z.infer<
  typeof UpdateRentalRequestBodySchema
>;
export type GetRentalRequestsQueryType = z.infer<
  typeof GetRentalRequestsQuerySchema
>;

// Response types
export interface GetRentalRequestsResType {
  data: RentalRequestType[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type RentalRequestDetailType = RentalRequestType;
