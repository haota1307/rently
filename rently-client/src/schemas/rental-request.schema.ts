import { z } from "zod";

// Enum cho trạng thái yêu cầu thuê
export enum RentalRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELED = "CANCELED",
  COMPLETED = "COMPLETED",
}

export enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  E_WALLET = "E_WALLET",
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
  userId: z.number({ invalid_type_error: "ID người dùng phải là số" }),
  postId: z.number({ invalid_type_error: "ID bài đăng phải là số" }),
  status: z.nativeEnum(RentalRequestStatus, {
    errorMap: () => ({ message: "Trạng thái yêu cầu thuê phòng không hợp lệ" }),
  }),
  startDate: z.date({ invalid_type_error: "Ngày bắt đầu không hợp lệ" }),
  endDate: z.date({ invalid_type_error: "Ngày kết thúc không hợp lệ" }),
  deposit: z.number({ invalid_type_error: "Tiền đặt cọc phải là số" }),
  monthlyFee: z.number({ invalid_type_error: "Phí hàng tháng phải là số" }),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: "Phương thức thanh toán không hợp lệ" }),
  }),
  note: z
    .string({ invalid_type_error: "Ghi chú phải là chuỗi" })
    .optional()
    .nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  post: RentalRequestPostSchema,
  tenant: RentalRequestUserSchema,
  landlord: RentalRequestUserSchema,
});

// Schema cho tạo yêu cầu thuê mới
export const CreateRentalRequestBodySchema = z
  .object({
    postId: z.number({ invalid_type_error: "ID bài đăng phải là số" }),
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
    deposit: z
      .number({ invalid_type_error: "Tiền đặt cọc phải là số" })
      .min(0, { message: "Tiền đặt cọc không được âm" }),
    monthlyFee: z
      .number({ invalid_type_error: "Phí hàng tháng phải là số" })
      .min(0, { message: "Phí hàng tháng không được âm" }),
    paymentMethod: z.nativeEnum(PaymentMethod, {
      errorMap: () => ({ message: "Phương thức thanh toán không hợp lệ" }),
    }),
    note: z.string({ invalid_type_error: "Ghi chú phải là chuỗi" }).optional(),
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

// Schema cho cập nhật yêu cầu thuê
export const UpdateRentalRequestBodySchema = z.object({
  status: z.nativeEnum(RentalRequestStatus).optional(),
  rejectionReason: z.string().optional(),
  contractSigned: z.boolean().optional(),
  depositAmount: z.number().optional(),
  note: z.string().optional(),
});

// Schema cho query lấy danh sách yêu cầu thuê
export const GetRentalRequestsQuerySchema = z
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
    status: z
      .nativeEnum(RentalRequestStatus, {
        errorMap: () => ({
          message: "Trạng thái yêu cầu thuê phòng không hợp lệ",
        }),
      })
      .optional(),
    userId: z.coerce
      .number({ invalid_type_error: "ID người dùng phải là số" })
      .optional(),
    postId: z.coerce
      .number({ invalid_type_error: "ID bài đăng phải là số" })
      .optional(),
    startDate: z
      .string({ invalid_type_error: "Ngày bắt đầu phải là chuỗi" })
      .optional(),
    endDate: z
      .string({ invalid_type_error: "Ngày kết thúc phải là chuỗi" })
      .optional(),
  })
  .strict();

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
