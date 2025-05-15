import { z } from "zod";
import { AmenitySchema } from "./amenity.schema";

// Kiểu dữ liệu cho Room Type
export enum RoomTypeEnum {
  ROOM = "ROOM",
  WHOLE_HOUSE = "WHOLE_HOUSE",
  APARTMENT = "APARTMENT",
}

// Schema cho RoomAmenity (liên kết giữa phòng và tiện ích)
export const RoomAmenitySchema = z.object({
  id: z.number(),
  roomId: z.number({ invalid_type_error: "ID phòng phải là số" }),
  amenityId: z.number({ invalid_type_error: "ID tiện ích phải là số" }),
  createdAt: z.date().nullable(),
});

// Schema cho RoomImage (ảnh phòng)
export const RoomImageSchema = z.object({
  id: z.number(),
  imageUrl: z.string({ invalid_type_error: "URL ảnh phải là chuỗi" }),
  order: z.number({ invalid_type_error: "Thứ tự phải là số" }).optional(),
  roomId: z.number({ invalid_type_error: "ID phòng phải là số" }),
  createdAt: z.date().nullable(),
});

// Schema cơ bản cho Room
export const RoomSchema = z.object({
  id: z.number(),
  name: z.string({ invalid_type_error: "Tên phòng phải là chuỗi" }),
  type: z.nativeEnum(RoomTypeEnum, {
    errorMap: () => ({ message: "Loại phòng không hợp lệ" }),
  }),
  area: z
    .number({ invalid_type_error: "Diện tích phải là số" })
    .positive({ message: "Diện tích phải là số dương" }),
  capacity: z
    .number({ invalid_type_error: "Sức chứa phải là số" })
    .int({ message: "Sức chứa phải là số nguyên" })
    .positive({ message: "Sức chứa phải là số dương" }),
  description: z.string({ invalid_type_error: "Mô tả phải là chuỗi" }),
  rentalId: z.number({ invalid_type_error: "ID nhà trọ phải là số" }),
  price: z
    .number({ invalid_type_error: "Giá phải là số" })
    .positive({ message: "Giá phải là số dương" }),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  amenities: z.array(AmenitySchema).optional(),
  roomAmenities: z.array(RoomAmenitySchema).optional(),
  roomImages: z.array(RoomImageSchema).optional(),
});

// Schema mở rộng cho Room, bao gồm thông tin về các tiện ích
export const RoomWithAmenitiesSchema = RoomSchema.extend({
  amenities: z.array(AmenitySchema),
});

// Schema cho kết quả trả về khi lấy danh sách phòng
export const GetRoomsResSchema = z.object({
  data: z.array(RoomWithAmenitiesSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

// Schema cho query params khi lấy danh sách phòng
export const GetRoomsQuerySchema = z
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
    name: z
      .string({ invalid_type_error: "Tên phòng phải là chuỗi" })
      .optional(),
    type: z
      .nativeEnum(RoomTypeEnum, {
        errorMap: () => ({ message: "Loại phòng không hợp lệ" }),
      })
      .optional(),
    minArea: z.coerce
      .number({ invalid_type_error: "Diện tích tối thiểu phải là số" })
      .optional(),
    maxArea: z.coerce
      .number({ invalid_type_error: "Diện tích tối đa phải là số" })
      .optional(),
    minPrice: z.coerce
      .number({ invalid_type_error: "Giá tối thiểu phải là số" })
      .optional(),
    maxPrice: z.coerce
      .number({ invalid_type_error: "Giá tối đa phải là số" })
      .optional(),
    capacity: z.coerce
      .number({ invalid_type_error: "Sức chứa phải là số" })
      .optional(),
    rentalId: z.coerce
      .number({ invalid_type_error: "ID nhà trọ phải là số" })
      .optional(),
    amenityIds: z
      .array(z.number({ invalid_type_error: "ID tiện ích phải là số" }))
      .optional(),
  })
  .strict();

// Schema cho params của API khi lấy chi tiết phòng
export const GetRoomParamsSchema = z
  .object({
    roomId: z.coerce.number({ invalid_type_error: "ID phòng phải là số" }),
  })
  .strict();

// Schema cho response khi lấy chi tiết phòng
export const GetRoomDetailResSchema = RoomWithAmenitiesSchema;

// Schema cho body khi tạo mới phòng
export const CreateRoomBodySchema = z
  .object({
    name: z
      .string({ invalid_type_error: "Tên phòng phải là chuỗi" })
      .min(3, { message: "Tên phòng phải có ít nhất 3 ký tự" }),
    type: z.nativeEnum(RoomTypeEnum, {
      errorMap: () => ({ message: "Loại phòng không hợp lệ" }),
    }),
    area: z
      .number({ invalid_type_error: "Diện tích phải là số" })
      .positive({ message: "Diện tích phải là số dương" }),
    capacity: z
      .number({ invalid_type_error: "Sức chứa phải là số" })
      .int({ message: "Sức chứa phải là số nguyên" })
      .positive({ message: "Sức chứa phải là số dương" }),
    description: z.string({ invalid_type_error: "Mô tả phải là chuỗi" }),
    price: z
      .number({ invalid_type_error: "Giá phải là số" })
      .positive({ message: "Giá phải là số dương" }),
    rentalId: z.number({ invalid_type_error: "ID nhà trọ phải là số" }),
    amenityIds: z
      .array(z.number({ invalid_type_error: "ID tiện ích phải là số" }))
      .optional(),
    roomImages: z
      .array(
        z.object({
          imageUrl: z.string({ invalid_type_error: "URL ảnh phải là chuỗi" }),
          order: z
            .number({ invalid_type_error: "Thứ tự phải là số" })
            .optional(),
        })
      )
      .optional(),
  })
  .strict();

// Schema cho body khi cập nhật thông tin phòng
export const UpdateRoomBodySchema = z
  .object({
    name: z
      .string({ invalid_type_error: "Tên phòng phải là chuỗi" })
      .min(3, { message: "Tên phòng phải có ít nhất 3 ký tự" })
      .optional(),
    type: z
      .nativeEnum(RoomTypeEnum, {
        errorMap: () => ({ message: "Loại phòng không hợp lệ" }),
      })
      .optional(),
    area: z
      .number({ invalid_type_error: "Diện tích phải là số" })
      .positive({ message: "Diện tích phải là số dương" })
      .optional(),
    capacity: z
      .number({ invalid_type_error: "Sức chứa phải là số" })
      .int({ message: "Sức chứa phải là số nguyên" })
      .positive({ message: "Sức chứa phải là số dương" })
      .optional(),
    description: z
      .string({ invalid_type_error: "Mô tả phải là chuỗi" })
      .optional(),
    price: z
      .number({ invalid_type_error: "Giá phải là số" })
      .positive({ message: "Giá phải là số dương" })
      .optional(),
    amenityIds: z
      .array(z.number({ invalid_type_error: "ID tiện ích phải là số" }))
      .optional(),
    roomImages: z
      .array(
        z.object({
          imageUrl: z.string({ invalid_type_error: "URL ảnh phải là chuỗi" }),
          order: z
            .number({ invalid_type_error: "Thứ tự phải là số" })
            .optional(),
        })
      )
      .optional(),
  })
  .strict();

// Export các type tương ứng từ các schema
export type Room = z.infer<typeof RoomSchema>;
export type RoomWithAmenities = z.infer<typeof RoomWithAmenitiesSchema>;
export type GetRoomsRes = z.infer<typeof GetRoomsResSchema>;
export type GetRoomsQuery = z.infer<typeof GetRoomsQuerySchema>;
export type GetRoomParams = z.infer<typeof GetRoomParamsSchema>;
export type GetRoomDetailRes = z.infer<typeof GetRoomDetailResSchema>;
export type CreateRoomBody = z.infer<typeof CreateRoomBodySchema>;
export type UpdateRoomBody = z.infer<typeof UpdateRoomBodySchema>;
