import { RoomSchema } from "@/schemas/room.schema";
import { z } from "zod";

export enum RentalPostStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DELETED = "DELETED",
}

// Schema cho thông tin ảnh nhà trọ
export const RentalImageSchema = z.object({
  id: z.number(),
  imageUrl: z.string(),
  order: z.number(),
  createdAt: z.date().nullable(),
});

// Schema cho thông tin bất động sản (Rental)
export const RentalSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  createdAt: z.date(),
  rentalImages: z.array(RentalImageSchema).optional(),
});

// Schema cho thông tin người đăng (Landlord) - dùng thông tin từ model User
export const LandlordSchema = z.object({
  id: z.number(),
  name: z.string(),
  avatar: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  email: z.string().email(),
});

// Schema cơ bản cho Post (bài đăng cho thuê)
export const PostSchema = z.object({
  id: z.number(),
  startDate: z.date(),
  endDate: z.date(),
  pricePaid: z.preprocess((arg) => {
    if (typeof arg === "object" && arg !== null && "toNumber" in arg) {
      return (arg as any).toNumber();
    }
    return arg;
  }, z.number()),
  title: z.string(),
  description: z.string(),
  status: z.nativeEnum(RentalPostStatus),
  rentalId: z.number(),
  landlordId: z.number(),
  createdAt: z.date(),
});

// Schema chi tiết cho Post, bao gồm thông tin của rental và landlord
export const PostDetailSchema = PostSchema.extend({
  rental: RentalSchema,
  landlord: LandlordSchema,
  room: RoomSchema,
});

// Schema cho kết quả trả về khi lấy danh sách bài đăng
export const GetPostsResSchema = z.object({
  data: z.array(PostDetailSchema),
  totalItems: z.number(), // Tổng số bài đăng
  page: z.number(), // Trang hiện tại
  limit: z.number(), // Số bài đăng trên 1 trang
  totalPages: z.number(), // Tổng số trang
});

export const GetPostsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    title: z.string().optional(),
    status: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .strict();

export const GetPostParamsSchema = z
  .object({
    rentalPostId: z.coerce.number(),
  })
  .strict();

export const GetPostDetailResSchema = PostDetailSchema;

export const CreatePostBodySchema = z
  .object({
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid startDate",
      })
      .transform((val) => new Date(val)),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid endDate" })
      .transform((val) => new Date(val)),
    title: z.string(),
    roomId: z.number(),
    description: z.string(),
    status: z
      .nativeEnum(RentalPostStatus)
      .optional()
      .default(RentalPostStatus.ACTIVE),
    pricePaid: z.number(),
    rentalId: z.number(),
  })
  .strict();

export const UpdatePostBodySchema = CreatePostBodySchema;

export type PostType = z.infer<typeof PostDetailSchema>;
export type GetPostsResType = z.infer<typeof GetPostsResSchema>;
export type GetPostsQueryType = z.infer<typeof GetPostsQuerySchema>;
export type GetPostParamsType = z.infer<typeof GetPostParamsSchema>;
export type GetPostDetailResType = z.infer<typeof GetPostDetailResSchema>;
export type CreatePostBodyType = z.infer<typeof CreatePostBodySchema>;
export type UpdatePostBodyType = z.infer<typeof UpdatePostBodySchema>;
