import { RoomSchema } from "@/schemas/room.schema";
import { z } from "zod";

export enum RentalPostStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DELETED = "DELETED",
  SUSPENDED = "SUSPENDED", // Trạng thái riêng cho tạm ngưng bài đăng
}

// Schema cho thông tin ảnh nhà trọ
export const RentalImageSchema = z.object({
  id: z.number(),
  imageUrl: z.string({ invalid_type_error: "URL ảnh phải là chuỗi" }),
  order: z.number({ invalid_type_error: "Thứ tự phải là số" }),
  createdAt: z.date().nullable(),
});

// Schema cho thông tin bất động sản (Rental)
export const RentalSchema = z.object({
  id: z.number(),
  title: z.string({ invalid_type_error: "Tiêu đề phải là chuỗi" }),
  description: z.string({ invalid_type_error: "Mô tả phải là chuỗi" }),
  address: z.string({ invalid_type_error: "Địa chỉ phải là chuỗi" }),
  lat: z.number({ invalid_type_error: "Vĩ độ phải là số" }),
  lng: z.number({ invalid_type_error: "Kinh độ phải là số" }),
  distance: z
    .number({ invalid_type_error: "Khoảng cách phải là số" })
    .optional(),
  createdAt: z.date(),
  rentalImages: z.array(RentalImageSchema).optional(),
});

// Schema cho thông tin người đăng (Landlord) - dùng thông tin từ model User
export const LandlordSchema = z.object({
  id: z.number(),
  name: z.string({ invalid_type_error: "Tên phải là chuỗi" }),
  avatar: z.string({ invalid_type_error: "Avatar phải là chuỗi" }).nullable(),
  phoneNumber: z
    .string({ invalid_type_error: "Số điện thoại phải là chuỗi" })
    .nullable(),
  email: z
    .string({ invalid_type_error: "Email phải là chuỗi" })
    .email({ message: "Email không hợp lệ" }),
});

// Schema cơ bản cho Post (bài đăng cho thuê)
export const PostSchema = z.object({
  id: z.number(),
  startDate: z.date({ invalid_type_error: "Ngày bắt đầu không hợp lệ" }),
  endDate: z.date({ invalid_type_error: "Ngày kết thúc không hợp lệ" }),
  pricePaid: z.preprocess(
    (arg) => {
      if (typeof arg === "object" && arg !== null && "toNumber" in arg) {
        return (arg as any).toNumber();
      }
      return arg;
    },
    z.number({ invalid_type_error: "Giá thuê phải là số" })
  ),
  deposit: z
    .preprocess(
      (arg) => {
        if (typeof arg === "object" && arg !== null && "toNumber" in arg) {
          return (arg as any).toNumber();
        }
        return arg;
      },
      z.number({ invalid_type_error: "Tiền đặt cọc phải là số" })
    )
    .default(0),
  title: z.string({ invalid_type_error: "Tiêu đề phải là chuỗi" }),
  description: z.string({ invalid_type_error: "Mô tả phải là chuỗi" }),
  status: z.nativeEnum(RentalPostStatus, {
    errorMap: () => ({ message: "Trạng thái bài đăng không hợp lệ" }),
  }),
  rentalId: z.number({ invalid_type_error: "ID nhà thuê phải là số" }),
  landlordId: z.number({ invalid_type_error: "ID chủ nhà phải là số" }),
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
    page: z.coerce
      .number()
      .int({ message: "Trang phải là số nguyên" })
      .positive({ message: "Trang phải là số dương" })
      .default(1),
    limit: z.coerce
      .number()
      .int({ message: "Giới hạn phải là số nguyên" })
      .positive({ message: "Giới hạn phải là số dương" })
      .default(10),
    title: z.string({ invalid_type_error: "Tiêu đề phải là chuỗi" }).optional(),
    status: z
      .string({ invalid_type_error: "Trạng thái phải là chuỗi" })
      .optional(),
    startDate: z
      .string({ invalid_type_error: "Ngày bắt đầu phải là chuỗi" })
      .optional(),
    endDate: z
      .string({ invalid_type_error: "Ngày kết thúc phải là chuỗi" })
      .optional(),
    distance: z
      .string({ invalid_type_error: "Khoảng cách phải là chuỗi" })
      .optional(),
    area: z
      .string({ invalid_type_error: "Diện tích phải là chuỗi" })
      .optional(),
    price: z.string({ invalid_type_error: "Giá phải là chuỗi" }).optional(),
    sort: z
      .enum([
        "newest",
        "price-asc",
        "price-desc",
        "area-asc",
        "area-desc",
        "distance",
      ] as const)
      .optional(),
    amenityIds: z
      .array(z.number({ invalid_type_error: "ID tiện ích phải là số" }))
      .optional(),
  })
  .strict();

export const GetPostParamsSchema = z
  .object({
    rentalPostId: z.coerce.number({
      invalid_type_error: "ID bài đăng phải là số",
    }),
  })
  .strict();

export const GetPostDetailResSchema = PostDetailSchema;

export const CreatePostBodySchema = z
  .object({
    startDate: z
      .string({ invalid_type_error: "Ngày bắt đầu phải là chuỗi" })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Ngày bắt đầu không hợp lệ",
      })
      .transform((val) => new Date(val)),
    endDate: z
      .string({ invalid_type_error: "Ngày kết thúc phải là chuỗi" })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Ngày kết thúc không hợp lệ",
      })
      .transform((val) => new Date(val)),
    title: z
      .string({ invalid_type_error: "Tiêu đề phải là chuỗi" })
      .min(5, { message: "Tiêu đề phải có ít nhất 5 ký tự" }),
    roomId: z.number({ invalid_type_error: "ID phòng phải là số" }),
    description: z
      .string({ invalid_type_error: "Mô tả phải là chuỗi" })
      .min(10, { message: "Mô tả phải có ít nhất 10 ký tự" }),
    status: z
      .nativeEnum(RentalPostStatus, {
        errorMap: () => ({ message: "Trạng thái bài đăng không hợp lệ" }),
      })
      .optional()
      .default(RentalPostStatus.ACTIVE),
    pricePaid: z
      .number({ invalid_type_error: "Giá thuê phải là số" })
      .min(0, { message: "Giá thuê không được âm" }),
    deposit: z
      .number({ invalid_type_error: "Tiền đặt cọc phải là số" })
      .min(0, { message: "Tiền đặt cọc không được âm" })
      .optional()
      .default(0),
    rentalId: z.number({ invalid_type_error: "ID nhà thuê phải là số" }),
  })
  .strict()
  .refine(
    (data) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      return startDate < endDate;
    },
    {
      message: "Ngày bắt đầu phải trước ngày kết thúc",
      path: ["startDate"],
    }
  );

export const UpdatePostBodySchema = CreatePostBodySchema;

// Schema cho cập nhật trạng thái bài đăng
export const UpdatePostStatusSchema = z.object({
  status: z.nativeEnum(RentalPostStatus, {
    errorMap: () => ({ message: "Trạng thái bài đăng không hợp lệ" }),
  }),
});

// Schema cho tạo bài đăng hàng loạt
export const CreateBulkPostsBodySchema = z
  .object({
    rentalId: z.number({ invalid_type_error: "ID nhà thuê phải là số" }),
    baseName: z.string().min(1, "Tên cơ bản không được để trống"), // Tên cơ bản cho bài đăng
    roomIds: z
      .array(z.number({ invalid_type_error: "ID phòng phải là số" }))
      .min(1, "Phải chọn ít nhất 1 phòng")
      .max(50, "Tối đa 50 phòng"), // Danh sách ID phòng
    startDate: z
      .string({ invalid_type_error: "Ngày bắt đầu phải là chuỗi" })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Ngày bắt đầu không hợp lệ",
      })
      .transform((val) => new Date(val)),
    endDate: z
      .string({ invalid_type_error: "Ngày kết thúc phải là chuỗi" })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Ngày kết thúc không hợp lệ",
      })
      .transform((val) => new Date(val)),
    description: z
      .string({ invalid_type_error: "Mô tả phải là chuỗi" })
      .min(10, { message: "Mô tả phải có ít nhất 10 ký tự" }),
    status: z
      .nativeEnum(RentalPostStatus, {
        errorMap: () => ({ message: "Trạng thái bài đăng không hợp lệ" }),
      })
      .optional()
      .default(RentalPostStatus.ACTIVE),
    // pricePaid sẽ được lấy từ giá phòng, không cần nhập
    deposit: z
      .number({ invalid_type_error: "Tiền đặt cọc phải là số" })
      .min(0, { message: "Tiền đặt cọc không được âm" })
      .optional()
      .default(0),
  })
  .strict()
  .refine(
    (data) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      return startDate < endDate;
    },
    {
      message: "Ngày bắt đầu phải trước ngày kết thúc",
      path: ["startDate"],
    }
  );

export const CreateBulkPostsResSchema = z.object({
  message: z.string(),
  createdPosts: z.array(PostDetailSchema),
  totalCreated: z.number(),
});

// Thêm schema cho API getNearbyPosts
export const GetNearbyPostsResSchema = z.object({
  data: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      price: z.number().or(z.string().transform(Number)),
      address: z.string(),
      area: z.number().or(z.string().transform(Number)),
      distance: z.number().nullable().optional(),
      images: z.array(
        z.object({
          url: z.string(),
          order: z.number(),
        })
      ),
      amenities: z.array(z.string()),
      status: z.string(),
    })
  ),
  totalItems: z.number(),
});

export type PostType = z.infer<typeof PostDetailSchema>;
export type GetPostsResType = z.infer<typeof GetPostsResSchema>;
export type GetPostsQueryType = z.infer<typeof GetPostsQuerySchema>;
export type GetPostParamsType = z.infer<typeof GetPostParamsSchema>;
export type GetPostDetailResType = z.infer<typeof GetPostDetailResSchema>;
export type CreatePostBodyType = z.infer<typeof CreatePostBodySchema>;
export type UpdatePostBodyType = z.infer<typeof UpdatePostBodySchema>;
export type UpdatePostStatusType = z.infer<typeof UpdatePostStatusSchema>;
export type CreateBulkPostsBodyType = z.infer<typeof CreateBulkPostsBodySchema>;
export type CreateBulkPostsResType = z.infer<typeof CreateBulkPostsResSchema>;
export type GetNearbyPostsResType = z.infer<typeof GetNearbyPostsResSchema>;
