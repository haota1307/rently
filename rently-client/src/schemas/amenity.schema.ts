import { z } from "zod";

export const AmenitySchema = z.object({
  id: z.number({ invalid_type_error: "Mã tiện ích không hợp lệ" }),
  name: z.string({ required_error: "Tên tiện ích là bắt buộc" }),
  createdAt: z.date({ invalid_type_error: "Ngày tạo không hợp lệ" }),
});

export const GetAmenitiesResSchema = z.object({
  data: z.array(AmenitySchema, { invalid_type_error: "Dữ liệu không hợp lệ" }),
  totalItems: z.number({ invalid_type_error: "Tổng số không hợp lệ" }),
  page: z.number({ invalid_type_error: "Số trang không hợp lệ" }),
  limit: z.number({ invalid_type_error: "Giới hạn không hợp lệ" }),
  totalPages: z.number({ invalid_type_error: "Tổng số trang không hợp lệ" }),
});

export const GetAmenitiesQuerySchema = z
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
    name: z.string().optional(),
  })
  .strict();

export const CreateAmenityBodySchema = z
  .object({
    name: z.string().min(1, { message: "Tên tiện ích không được để trống" }),
  })
  .strict();

export const UpdateAmenityBodySchema = CreateAmenityBodySchema;

export type AmenityType = z.infer<typeof AmenitySchema>;
export type GetAmenitiesResType = z.infer<typeof GetAmenitiesResSchema>;
export type GetAmenitiesQueryType = z.infer<typeof GetAmenitiesQuerySchema>;
export type CreateAmenityBodyType = z.infer<typeof CreateAmenityBodySchema>;
export type UpdateAmenityBodyType = z.infer<typeof UpdateAmenityBodySchema>;
