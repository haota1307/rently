import { preprocessDecimal } from "@/lib/utils";
import { RoomSchema } from "@/schemas/room.schema";
import { GetlandlordResSchema } from "@/schemas/user.schema";
import { title } from "process";
import { z } from "zod";

export const RentalImageSchema = z.object({
  id: z.number({ invalid_type_error: "Mã hình ảnh không hợp lệ" }),
  imageUrl: z.string({ required_error: "Đường dẫn hình ảnh là bắt buộc" }),
  order: z.number({ invalid_type_error: "Thứ tự hình ảnh không hợp lệ" }),
  createdAt: z
    .date({ invalid_type_error: "Thời gian tạo không hợp lệ" })
    .nullable(),
  rentalId: z.number({ invalid_type_error: "Mã nhà trọ không hợp lệ" }),
});

export const RentalSchema = z.object({
  id: z.number({ invalid_type_error: "Mã nhà trọ không hợp lệ" }),
  title: z.string({ required_error: "Tiêu đề là bắt buộc" }),
  description: z.string({ required_error: "Mô tả là bắt buộc" }),
  address: z.string({ required_error: "Địa chỉ là bắt buộc" }),
  lat: z.preprocess(
    preprocessDecimal,
    z.number({ invalid_type_error: "Vĩ độ không hợp lệ" })
  ),
  lng: z.preprocess(
    preprocessDecimal,
    z.number({ invalid_type_error: "Kinh độ không hợp lệ" })
  ),
  distance: z
    .preprocess(
      preprocessDecimal,
      z.number({ invalid_type_error: "Khoảng cách không hợp lệ" })
    )
    .optional(),
  createdAt: z.date({ invalid_type_error: "Ngày tạo không hợp lệ" }).nullable(),
  updatedAt: z
    .date({ invalid_type_error: "Ngày cập nhật không hợp lệ" })
    .nullable(),
  landlordId: z.number({ invalid_type_error: "Mã chủ nhà không hợp lệ" }),
  landlord: GetlandlordResSchema.optional(),
  rentalImages: z.array(RentalImageSchema).optional(),
  rooms: z.array(RoomSchema).optional(),
});

export const GetRentalsResSchema = z.object({
  data: z.array(RentalSchema, { invalid_type_error: "Dữ liệu không hợp lệ" }),
  totalItems: z.number({ invalid_type_error: "Tổng số không hợp lệ" }),
  page: z.number({ invalid_type_error: "Số trang không hợp lệ" }),
  limit: z.number({ invalid_type_error: "Giới hạn không hợp lệ" }),
  totalPages: z.number({ invalid_type_error: "Tổng số trang không hợp lệ" }),
});

export const GetRentalsQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .positive({ message: "Số trang phải là số nguyên dương" })
      .default(1),
    limit: z.coerce
      .number()
      .int()
      .positive({ message: "Giới hạn phải là số nguyên dương" })
      .default(10),
    title: z.string().optional(),
    landlordId: z.coerce.number().int().positive().optional(),
  })
  .strict();

export const GetRentalParamsSchema = z
  .object({
    rentalId: z.coerce.number({
      invalid_type_error: "Mã nhà trọ không hợp lệ",
    }),
  })
  .strict();

export const GetRentalDetailResSchema = RentalSchema;

export const CreateRentalBodySchema = z
  .object({
    title: z
      .string({ required_error: "Tiêu đề là bắt buộc" })
      .min(1, { message: "Tiêu đề không được để trống" }),
    description: z
      .string({ required_error: "Mô tả là bắt buộc" })
      .min(1, { message: "Mô tả không được để trống" }),
    address: z
      .string({ required_error: "Địa chỉ là bắt buộc" })
      .min(1, { message: "Địa chỉ không được để trống" }),
    lat: z.number({ invalid_type_error: "Vĩ độ không hợp lệ" }),
    lng: z.number({ invalid_type_error: "Kinh độ không hợp lệ" }),
    landlordId: z.number({ invalid_type_error: "Mã chủ nhà không hợp lệ" }),
    rentalImages: z
      .array(
        z.object({
          imageUrl: z.string({
            required_error: "Đường dẫn hình ảnh là bắt buộc",
          }),
          order: z
            .number({ invalid_type_error: "Thứ tự hình ảnh không hợp lệ" })
            .optional(),
        })
      )
      .optional(),
  })
  .strict();

export const UpdateRentalBodySchema = CreateRentalBodySchema;

export type RentalType = z.infer<typeof RentalSchema>;
export type GetRentalsResType = z.infer<typeof GetRentalsResSchema>;
export type GetRentalsQueryType = z.infer<typeof GetRentalsQuerySchema>;
export type GetRentalParamsType = z.infer<typeof GetRentalParamsSchema>;
export type GetRentalDetailResType = z.infer<typeof GetRentalDetailResSchema>;
export type CreateRentalBodyType = z.infer<typeof CreateRentalBodySchema>;
export type UpdateRentalBodyType = z.infer<typeof UpdateRentalBodySchema>;
